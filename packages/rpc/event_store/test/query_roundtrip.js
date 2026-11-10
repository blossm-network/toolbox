import assert from "node:assert/strict";
import { afterEach, describe, it } from "mocha";
import { fake, replace, restore } from "sinon";
import eventStore from "../index.js";
import rpcDeps from "../../generic/deps.js";
import requestDeps from "../../../lib/request/deps.js";
import serverDeps from "../../../procedures/server/deps.js";
import get from "../../../procedures/event_stores/generic/get/index.js";

const values = [false, true, null, 0, "", "false", "true", "null", "0"];
const states = [...values.map((value) => ({ value })), {}];

const run = async (pairs) => {
  const route = get({
    findSnapshotsFn: async () => [],
    rootStreamFn: async ({ fn }) => {
      for (let i = 0; i < states.length; i++) await fn({ root: String(i) });
    },
    findOneSnapshotFn: async () => undefined,
    eventStreamFn: async ({ query, fn }) =>
      fn({
        headers: { action: "set", number: 0 },
        payload: states[Number(query["headers.root"])],
        context: {},
        tx: {},
      }),
    handlers: { set: (_, payload) => payload },
  });
  const parse = serverDeps.express().get("query parser fn");
  replace(rpcDeps, "operationToken", fake.resolves(null));
  replace(
    requestDeps,
    "fetch",
    (target) =>
      new Promise((resolve, reject) => {
        const url = new URL(target);
        route(
          { params: {}, query: parse(url.search.slice(1)) },
          { send: (body) => resolve(new Response(JSON.stringify(body))) },
        ).catch(reject);
      }),
  );
  return (await eventStore({ domain: "test", service: "test" }).query(pairs))
    .body;
};

describe("Aggregate query RPC roundtrip", () => {
  afterEach(restore);
  for (const [index, value] of values.entries()) {
    it(`preserves ${JSON.stringify(value)} (${typeof value}) through encoding and parsing`, async () => {
      const result = await run([{ key: "value", value }]);
      assert.deepEqual(
        result.map(({ headers }) => headers.root),
        [String(index)],
      );
    });
  }
  it("preserves an empty pair list and returns every root", async () => {
    assert.equal((await run([])).length, states.length);
  });
});
