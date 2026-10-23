import assert from "node:assert/strict";
import { fake, replace, restore } from "sinon";
import stream from "../index.js";
import deps from "../deps.js";
import request from "../../../lib/request/index.js";
import requestDeps from "../../../lib/request/deps.js";

const parts = ["account", "core", "event-store"];
const region = "region";

describe("Merged stream RPC", () => {
  beforeEach(() => {
    process.env.HOST = "internal";
    process.env.NODE_ENV = "production";
  });
  afterEach(restore);

  it("constructs ordinary RPC identity and preserves caller query objects", async () => {
    const producer = fake.resolves({ token: "fake-identity", type: "Bearer" });
    const streamMany = fake.resolves();
    replace(deps, "streamMany", streamMany);
    const query = Object.freeze({ id: "root", active: true });
    await stream({
      region,
      operationNameComponentQueries: [
        { operationNameComponents: parts, query },
      ],
      fn: () => undefined,
    })
      .in({ context: { principal: "p" } })
      .with({
        path: "/stream",
        internalTokenFn: producer,
        currentToken: "fake-current",
        claims: { role: "reader" },
      });
    assert.equal(producer.callCount, 1);
    assert.equal(typeof producer.firstCall.args[0].hash, "string");
    const target = streamMany.firstCall.args[0][0];
    assert.match(target.url, /\/stream\/root$/);
    assert.doesNotMatch(target.url, /object Object/);
    assert.deepEqual(target.headers, { authorization: "Bearer fake-identity" });
    assert.deepEqual(target.query, {
      active: true,
      context: { principal: "p" },
      token: "fake-current",
      claims: { role: "reader" },
    });
    assert.deepEqual(query, { id: "root", active: true });
    assert.equal(streamMany.firstCall.args[3].decode, request.jsonDecoder);
  });

  it("permits no custom token producer and never forwards internal claims externally", async () => {
    const streamMany = fake.resolves();
    replace(deps, "streamMany", streamMany);
    await stream({
      operationNameComponentQueries: [{ operationNameComponents: parts }],
      fn: () => undefined,
    })
      .in({})
      .with();
    assert.equal(streamMany.firstCall.args[0][0].headers, undefined);
    await stream({
      operationNameComponentQueries: [
        { operationNameComponents: parts, query: { id: "r", a: 1 } },
      ],
      fn: () => undefined,
    })
      .in({
        host: "other.invalid",
        network: "other",
        context: { principal: "private" },
      })
      .with({
        path: "/aggregate",
        externalTokenFn: async () => ({
          token: "fake-external",
          type: "Bearer",
        }),
        claims: { secret: true },
        currentToken: "private-token",
      });
    assert.deepEqual(streamMany.lastCall.args[0][0], {
      url: "https://other.invalid/aggregate/r",
      query: { a: 1 },
      headers: { authorization: "Bearer fake-external" },
    });
  });

  it("decodes fragmented records independently before sorting actual HTTP source bodies", async () => {
    replace(deps, "streamMany", request.streamMany);
    replace(requestDeps, "fetch", async (url) => {
      const values =
        url.pathname === "/first"
          ? ['{"n":1,"text":"} 🦋"}{"n":', "3}"]
          : ['{"n":2}{"n":', "4}"];
      return new Response(
        new ReadableStream({
          start(controller) {
            for (const part of values) controller.enqueue(Buffer.from(part));
            controller.close();
          },
        })
      );
    });
    const output = [];
    await stream({
      operationNameComponentQueries: [
        { operationNameComponents: parts, query: { id: "first" } },
        { operationNameComponents: parts, query: { id: "second" } },
      ],
      fn: async (record) => output.push(record.n),
      sortFn: (a, b) => a.n - b.n,
    })
      .in({})
      .with();
    assert.deepEqual(output, [1, 2, 3, 4]);
  });

  it("propagates actual upstream HTTP errors and callback failures", async () => {
    replace(deps, "streamMany", request.streamMany);
    replace(
      requestDeps,
      "fetch",
      async () => new Response('{"message":"busy"}', { status: 503 })
    );
    await assert.rejects(
      stream({
        operationNameComponentQueries: [{ operationNameComponents: parts }],
        fn: () => {
          throw new Error("must not run");
        },
      })
        .in({})
        .with(),
      (error) => error.statusCode === 503 && error.message === "busy"
    );
  });
});
