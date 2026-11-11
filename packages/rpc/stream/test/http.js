import assert from "node:assert/strict";
import { createServer } from "node:http";
import { fake, replace, restore } from "sinon";
import stream from "../index.js";
import deps from "../deps.js";

const parts = ["fixture", "core", "event-store"];

describe("Native merged RPC streams", () => {
  let server;
  let active;
  let environment;

  beforeEach(async () => {
    environment = { HOST: process.env.HOST, NODE_ENV: process.env.NODE_ENV };
    Object.assign(process.env, {
      HOST: "fixture-internal",
      NODE_ENV: "production",
    });
    active = new Map();
    server = createServer((req, res) => {
      const path = new URL(req.url, "http://fixture.invalid").pathname;
      active.set(path, {
        res,
        closed: new Promise((resolve) => res.once("close", resolve)),
      });
      const n = path.endsWith("a") ? 1 : 2;
      if (path.startsWith("/fragments/")) {
        res.write(`{"n":${n},"text":"} 🦋"}{"n":`);
      } else if (path.startsWith("/callback/")) {
        res.write(JSON.stringify({ n }));
      } else {
        if (n === 1) res.write(JSON.stringify({ n }));
        const first = active.get("/failure/a");
        const second = active.get("/failure/b");
        if (first && second) {
          second.res.writeHead(503);
          second.res.end('{"message":"busy"}');
        }
      }
    });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    replace(
      deps,
      "operationUrl",
      ({ path, id }) =>
        `http://127.0.0.1:${server.address().port}${path}/${id}`,
    );
  });
  afterEach(async () => {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    restore();
    for (const [key, value] of Object.entries(environment)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  const run = (path, fn, sortFn) =>
    stream({
      operationNameComponentQueries: [
        { operationNameComponents: parts, query: Object.freeze({ id: "a" }) },
        { operationNameComponents: parts, query: Object.freeze({ id: "b" }) },
      ],
      fn,
      sortFn,
    })
      .in({})
      .with({ path, timeout: 1000 });

  it("decodes each actual fragmented HTTP source before comparing records", async () => {
    const factory = deps.jsonDecoder;
    let decoders = 0;
    replace(deps, "jsonDecoder", () => {
      decoders++;
      return factory();
    });
    const output = [];
    let processing = 0;
    await run(
      "/fragments",
      async ({ n, text }) => {
        processing++;
        assert.equal(processing, 1);
        await new Promise((resolve) => setImmediate(resolve));
        output.push(n);
        if (n <= 2) {
          assert.equal(text, "} 🦋");
          active.get(`/fragments/${n === 1 ? "a" : "b"}`).res.end(`${n + 2}}`);
        }
        processing--;
      },
      (a, b) => {
        assert.equal(typeof a.n, "number");
        assert.equal(typeof b.n, "number");
        return a.n - b.n;
      },
    );
    assert.deepEqual(output, [1, 2, 3, 4]);
    assert.equal(decoders, 2);
  });

  it("cancels an open peer when a source fails before merged output", async () => {
    const fn = fake();
    await assert.rejects(
      run("/failure", fn),
      (error) => error.statusCode === 503 && error.message === "busy",
    );
    assert.equal(fn.callCount, 0);
    await active.get("/failure/a").closed;
  });

  it("preserves callback errors and closes both sources without later callbacks", async () => {
    const failure = new Error("Cannot consume merged record");
    let calls = 0;
    await assert.rejects(
      run("/callback", async () => {
        calls++;
        await new Promise((resolve) => setImmediate(resolve));
        throw failure;
      }),
      (error) => error === failure,
    );
    assert.equal(calls, 1);
    await Promise.all([...active.values()].map(({ closed }) => closed));
  });
});
