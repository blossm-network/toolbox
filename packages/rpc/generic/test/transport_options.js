import assert from "node:assert/strict";
import { createServer } from "node:http";
import { fake, replace, restore } from "sinon";
import rpc from "../index.js";
import deps from "../deps.js";

const input = { value: "payload" };
const prepare = (url = "https://fixture.invalid/") => {
  replace(deps, "operationToken", fake.resolves(null));
  replace(deps, "operationUrl", fake.returns(url));
  return rpc({ operationNameComponents: ["fixture"] });
};

describe("RPC transport options", () => {
  afterEach(restore);

  for (const method of ["get", "post", "put", "del"]) {
    it(`keeps ${method} deadlines and cancellation out of application data`, async () => {
      const transport = fake.resolves({ statusCode: 200 });
      replace(deps, method, transport);
      const signal = new AbortController().signal;
      const builder = prepare();
      const operation =
        method === "put" || method === "del"
          ? builder[method]("root", input)
          : builder[method](input);
      await operation.in({}).with({ timeout: 120000, signal });
      const [, options] = transport.firstCall.args;
      assert.equal(options.timeout, 120000);
      assert.equal(options.signal, signal);
      assert.deepEqual(
        options[method === "post" || method === "put" ? "body" : "query"],
        input,
      );
    });
  }

  it("passes options through the single-source stream closure", async () => {
    const transport = fake.resolves(undefined);
    replace(deps, "stream", transport);
    const signal = new AbortController().signal;
    await prepare()
      .stream(() => {}, input)
      .in({})
      .with({ timeout: 120000, signal });
    const options = transport.firstCall.args[2];
    assert.equal(options.timeout, 120000);
    assert.equal(options.signal, signal);
    assert.deepEqual(options.query, input);
  });

  it("enforces configured deadlines and caller cancellation against native HTTP", async () => {
    const { default: request } = await import("../../../lib/request/index.js");
    replace(deps, "get", request.get);
    let requests = 0;
    let closeResponse;
    const closed = new Promise((resolve) => {
      closeResponse = resolve;
    });
    const server = createServer((req, res) => {
      requests++;
      res.once("close", closeResponse);
      // Leave headers pending so only the client's transport deadline ends it.
    });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    try {
      const operation = prepare(`http://127.0.0.1:${server.address().port}`);
      await assert.rejects(
        operation.get({}).in({}).with({ timeout: 500 }),
        (error) => error.name === "TimeoutError",
      );
      await closed;
      assert.equal(requests, 1);
      const failure = new Error("Caller cancelled RPC");
      const controller = new AbortController();
      controller.abort(failure);
      await assert.rejects(
        operation.get({}).in({}).with({ signal: controller.signal }),
        (error) => error === failure,
      );
      assert.equal(requests, 1);
    } finally {
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it("does not serialize transport options into queued operations", async () => {
    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = "test";
    try {
      const enqueue = fake.resolves({ statusCode: 202 });
      replace(deps, "enqueueOperation", enqueue);
      await prepare()
        .post(input)
        .in({})
        .with({
          timeout: 120000,
          signal: new AbortController().signal,
          enqueueFn: () => {},
        });
      const options = enqueue.firstCall.args[0];
      assert.equal(Object.hasOwn(options, "timeout"), false);
      assert.equal(Object.hasOwn(options, "signal"), false);
      assert.deepEqual(options.data, input);
    } finally {
      if (previous === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = previous;
    }
  });
});
