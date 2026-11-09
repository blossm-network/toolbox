import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { replace, restore } from "sinon";
import get from "../index.js";
import deps from "../deps.js";
import fact from "../../../../../rpc/fact/index.js";
import requestDeps from "../../../../../lib/request/deps.js";

class Response extends EventEmitter {
  chunks = [];
  destroyed = false;
  writeHead(status, headers) {
    this.statusCode = status;
    this.headers = headers;
  }
  write(chunk) {
    this.chunks.push(chunk);
    return true;
  }
  end() {
    this.ended = true;
  }
}

describe("Fact gateway stream composition", () => {
  afterEach(restore);

  it("forwards response headers before raw bytes through real fact and generic RPC", async () => {
    replace(deps, "fact", fact);
    const data = Buffer.from([0, 255, 1, 128]);
    replace(
      requestDeps,
      "fetch",
      async () =>
        new globalThis.Response(data, {
          headers: {
            "content-type": "application/octet-stream",
            "x-download": "example",
            connection: "close",
            "content-length": "4",
          },
        })
    );
    const res = new Response();
    await get({
      name: "download",
      domain: "file",
      service: "core",
      stream: true,
      internalTokenFn: async () => null,
    })({ query: {}, params: {} }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.headers["content-type"], "application/octet-stream");
    assert.equal(res.headers["x-download"], "example");
    assert.equal(res.headers.connection, undefined);
    assert.equal(res.headers["content-length"], undefined);
    assert.deepEqual(Buffer.concat(res.chunks), data);
    assert.ok(res.ended);
  });

  it("rejects an HTTP error before writing headers or body", async () => {
    replace(deps, "fact", fact);
    replace(
      requestDeps,
      "fetch",
      async () =>
        new globalThis.Response('{"message":"not permitted"}', { status: 403 })
    );
    const res = new Response();
    await assert.rejects(
      get({
        name: "download",
        stream: true,
        internalTokenFn: async () => null,
      })({ query: {}, params: {} }, res),
      (error) => error.statusCode === 403
    );
    assert.equal(res.statusCode, undefined);
    assert.equal(res.chunks.length, 0);
  });

  it("cancels its upstream request when the downstream client disconnects", async () => {
    replace(deps, "fact", fact);
    let upstream;
    replace(requestDeps, "fetch", async (_, { signal }) => {
      upstream = signal;
      return new globalThis.Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(Buffer.from("first"));
          },
        })
      );
    });
    const res = new Response();
    res.write = () => {
      res.destroyed = true;
      res.emit("close");
      return true;
    };
    await assert.rejects(
      get({
        name: "download",
        stream: true,
        internalTokenFn: async () => null,
      })({ query: {}, params: {} }, res),
      (error) => error.name === "AbortError"
    );
    assert.ok(upstream.aborted);
    assert.equal(res.listenerCount("close"), 0);
  });
});
