import { expect } from "chai";
import { replace, restore } from "sinon";
import stream from "../index.js";
import deps from "../deps.js";
import operationHash from "../../../lib/operation_hash/index.js";

describe("Stream operation identity", () => {
  afterEach(restore);

  it("uses the same operation tuple owner as ordinary RPC and deployment", async () => {
    const original = { HOST: process.env.HOST, NODE_ENV: process.env.NODE_ENV };
    process.env.HOST = "local";
    process.env.NODE_ENV = "local";
    try {
      const parts = ["account", "core", "event-store"];
      let requests;
      replace(deps, "streamMany", async (values) => { requests = values; });
      await stream({
        operationNameComponentQueries: [{ operationNameComponents: parts, query: {} }],
        fn: () => {},
      }).in({}).with({
        internalTokenFn: async () => ({ token: "fake", type: "Bearer" }),
      });
      expect(requests[0].url).to.equal(`http://${operationHash(...parts)}.local`);
    } finally {
      for (const [name, value] of Object.entries(original)) {
        if (value === undefined) delete process.env[name];
        else process.env[name] = value;
      }
    }
  });
});
