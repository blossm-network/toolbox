import assert from "node:assert/strict";
import { createServer } from "node:http";
import { fake, replace, restore } from "sinon";
import rpc from "../index.js";
import deps from "../deps.js";
import request from "../../../lib/request/index.js";

const values = [
  { text: '🦋 quoted " and braces } [, slash \\', nested: [{ n: 1 }] },
  [{ n: 2 }, { enabled: true }],
];
const bytes = Buffer.from(
  values.map((value) => JSON.stringify(value)).join("\n"),
);
const split = bytes.indexOf(Buffer.from("🦋")) + 2;
const invalid = Buffer.concat([
  Buffer.from('{"text":"'),
  Buffer.from([0xff]),
  Buffer.from('"}'),
]);

describe("Native RPC JSON stream composition", () => {
  let server;
  let base;
  let held;
  let closed;

  beforeEach(async () => {
    server = createServer((req, res) => {
      const path = new URL(req.url, "http://fixture.invalid").pathname;
      if (path === "/records") {
        held = res;
        res.write(bytes.subarray(0, split));
      } else if (path === "/callback") {
        closed = new Promise((resolve) => res.once("close", resolve));
        res.write('{}{"second":true}');
      } else if (path === "/truncated") res.end('{"partial":');
      else res.end(invalid);
    });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    base = `http://127.0.0.1:${server.address().port}`;
    replace(deps, "operationToken", fake.resolves(null));
  });
  afterEach(async () => {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    restore();
  });

  const run = (path, fn, raw = false) => {
    replace(deps, "operationUrl", fake.returns(`${base}${path}`));
    return rpc({ operationNameComponents: ["fixture"] })
      .stream(fn, {}, { raw })
      .in({})
      .with({ timeout: 1000 });
  };

  it("preserves Unicode and object/array records over an observed split codepoint", async () => {
    const output = [];
    let observed = 0;
    let released = false;
    let active = 0;
    replace(deps, "stream", (url, fn, options) =>
      request.stream(
        url,
        async (chunk) => {
          observed += chunk.length;
          await fn(chunk);
          // Release the tail only after the real client read the partial codepoint.
          if (!released && observed >= split) {
            assert.deepEqual(output, []);
            released = true;
            held.end(bytes.subarray(split));
          }
        },
        options,
      ),
    );
    await run("/records", async (record) => {
      active++;
      assert.equal(active, 1);
      await new Promise((resolve) => setImmediate(resolve));
      output.push(record);
      active--;
    });
    assert.equal(released, true);
    assert.deepEqual(output, values);
  });

  it("rejects malformed endings and invalid bytes while preserving the raw bypass", async () => {
    const output = [];
    await assert.rejects(
      run("/truncated", (record) => output.push(record)),
      SyntaxError,
    );
    restore();
    replace(deps, "operationToken", fake.resolves(null));
    await assert.rejects(
      run("/invalid", (record) => output.push(record)),
      TypeError,
    );
    assert.deepEqual(output, []);
    restore();
    replace(deps, "operationToken", fake.resolves(null));
    const raw = [];
    await run("/raw", (chunk) => raw.push(chunk), true);
    assert.deepEqual(Buffer.concat(raw), invalid);
  });

  it("awaits decoded callbacks and cancels the response after their failure", async () => {
    const failure = new Error("Cannot consume record");
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
    await closed;
  });
});
