import assert from "assert";
import { load } from "./load.js";
import composeUpdate from "../../../lib/compose_update/index.js";

const fixture = async ({ handler, response = { body: {} }, aggregateFn }) => {
  const updates = [];
  const deletions = [];
  const notifications = [];
  const projection = await load("blossm/src/projection/deploy/src/index.js", {
    projection: (options) => options,
    config: { name: "cards" },
    process: { env: { NODE_ENV: "local" } },
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
    composeUpdate,
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
        aggregateFn,
      }),
  };
};

describe("Generated projection helper semantics", () => {
  for (const roots of [["deleted"], ["nested"], ["deleted", "updated"]]) {
    it(`retains replay deletion through ${roots.join(" then ")}`, async () => {
      const query = { active: true };
      const calls = [];
      const replay = (root) => ({ root, service: "animals", domain: "bird" });
      const test = await fixture({
        handler: async ({ state }) => {
          if (!state) return { id: "id", replay: roots.map(replay) };
          if (state.root === "nested")
            return { id: "id", replay: [replay("deleted")] };
          return state.root === "deleted"
            ? { id: "id", del: true, query }
            : { id: "id", del: false, update: { label: "later" } };
        },
        aggregateFn: async ({ root }) => {
          calls.push(root);
          return { state: { root } };
        },
      });
      await test.run();
      assert.equal(test.deletions.length, 1);
      assert.equal(test.deletions[0][0], "id");
      assert.deepEqual(test.deletions[0][1].query, query);
      assert.deepEqual(test.updates, []);
      assert.deepEqual(
        calls,
        roots[0] === "nested" ? ["nested", "deleted"] : roots,
      );
    });
  }

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
    assert.deepStrictEqual(test.updates[0].arrayFilters, [filter]);
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
  it("keeps a guard on the same field being changed", async () => {
    const query = { status: "active" };
    const test = await fixture({
      handler: async () => ({
        id: "id",
        query,
        update: { status: "inactive" },
      }),
    });
    await test.run();
    assert.deepStrictEqual(test.updates[0].query, query);
  });

  it("does not notify or throw when a guarded update returns no content", async () => {
    const test = await fixture({
      handler: async () => ({
        id: "id",
        query: { status: "active" },
        update: { status: "inactive" },
      }),
      response: { statusCode: 204 },
    });
    await test.run(true);
    assert.deepStrictEqual(test.notifications, []);
  });
  it("retains nested ID guards when the view ID is already known", async () => {
    const query = { "parent.id": "A", "parent.child.id": "X" };
    const test = await fixture({
      handler: async () => ({ id: "id", query, update: { label: "new" } }),
    });
    await test.run();
    assert.deepStrictEqual(test.updates[0].query, query);
  });
});
