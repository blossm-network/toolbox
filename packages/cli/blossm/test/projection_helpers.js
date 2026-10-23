import assert from "assert";
import { load } from "./load.js";

const fixture = async ({ handler, response = { body: {} } }) => {
  const updates = [];
  const deletions = [];
  const notifications = [];
  const projection = await load("blossm/src/projection/deploy/src/index.js", {
    projection: (options) => options,
    config: { name: "cards" },
    process: { env: {} },
    handlers: { animals: { bird: handler } },
    viewStore: () => ({
      set: () => ({
        update: async (args) => {
          updates.push(args);
          return response;
        },
        delete: async (...args) => deletions.push(args),
      }),
    }),
    command: () => ({
      set: () => ({ issue: async (args) => notifications.push(args) }),
    }),
    channelName: () => "channel",
    logger: { error: () => {} },
    gcpToken: () => {},
    gcpSecret: { get: () => {} },
    gcpQueue: { enqueue: () => {} },
    composeUpdate: (update) => update,
  });
  return {
    updates,
    deletions,
    notifications,
    run: (push = false) =>
      projection.mainFn({
        aggregate: {
          headers: { service: "animals", domain: "bird", root: "root" },
        },
        push,
      }),
  };
};

describe("Generated projection helper semantics", () => {
  it("retains conditional queries and array filters for explicit IDs", async () => {
    const query = { status: "active" };
    const filter = { "item.id": "first" };
    const update = { $set: { "items.$[item].label": "new" } };
    const test = await fixture({
      handler: async () => ({
        id: "id",
        query,
        arrayFilters: [filter],
        update,
      }),
    });
    await test.run();
    assert.deepStrictEqual(test.updates[0].query, query);
    assert.deepStrictEqual(test.updates[0].arrayFilters, [filter, query]);
    assert.deepStrictEqual(test.updates[0].update, update);
  });
  it("retains the conditional query for deletes by explicit ID", async () => {
    const query = { status: "active" };
    const test = await fixture({
      handler: async () => ({ id: "id", query, del: true }),
    });
    await test.run();
    assert.deepStrictEqual(test.deletions, [["id", { query }]]);
  });
});
