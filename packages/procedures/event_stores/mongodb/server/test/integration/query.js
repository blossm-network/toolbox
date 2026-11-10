import assert from "node:assert/strict";
import { replace } from "sinon";
import mongoose from "mongoose";
import setup from "./setup.js";
import createEvent from "../../../../../../lib/create_event/index.js";
import postTransaction from "../../../../generic/post_transaction/index.js";
import get from "../../../../generic/get/index.js";
import server from "../../index.js";
import deps from "../../deps.js";

const handlers = {
  set: (state, payload) => ({ ...state, ...payload }),
  add: (state, { amount }) => ({
    ...state,
    total: (state.total || 0) + amount,
  }),
};

describe("Snapshot-assisted persisted aggregate queries", function () {
  this.timeout(30000);
  setup();
  let composition;
  let replayed;
  const append = (entries) =>
    postTransaction({
      normalizeTransactionFn: composition.normalizeTransactionFn,
      eventData: entries.map(({ root, action, payload }, index) => ({
        event: createEvent({
          root,
          action,
          payload,
          domain: "test",
          service: "events",
          network: "local",
          version: 1,
          idempotency: `${root}-${action}-${index}-${JSON.stringify(payload)}`,
        }),
      })),
      reserveRootCountsFn: composition.reserveRootCountsFn,
      saveEventsFn: composition.saveEventsFn,
      tx: { id: "query-data" },
    });
  const snapshot = (root, state, lastEventNumber = 0, number = 0) =>
    composition.saveSnapshotFn({
      snapshot: {
        hash: `${root}-${number}`,
        headers: {
          root,
          nonce: `${root}_${number}`,
          block: 0,
          number,
          cHash: "context",
          gHash: "groups",
          sHash: "state",
          pHash: "previous",
          created: new Date(number),
          isPublic: true,
          domain: "test",
          service: "events",
          network: "local",
          lastEventNumber,
          eCount: lastEventNumber + 1,
          eRoot: "events",
          eSize: 1,
        },
        state,
        context: {},
        groups: [],
        events: Buffer.alloc(0),
        txIds: [],
      },
    });
  before(async () => {
    replace(deps, "eventStore", (options) => {
      composition = options;
    });
    await server({
      schema: {
        a: Number,
        b: Number,
        total: Number,
        amount: Number,
        group: String,
      },
      indexes: ["a", "b", "group"],
      handlers,
      secretFn: async () => undefined,
    });
    const entries = [
      { root: "assembled", action: "set", payload: { a: 1 } },
      { root: "assembled", action: "set", payload: { b: 2 } },
      { root: "derived", action: "add", payload: { amount: 1 } },
      { root: "derived", action: "add", payload: { amount: 2 } },
      { root: "snapshotted", action: "add", payload: { amount: 1 } },
      { root: "stale", action: "set", payload: { a: 1, b: 2 } },
      { root: "fresh", action: "set", payload: { a: 1, b: 2 } },
      { root: "unrelated", action: "set", payload: { a: 7, b: 8 } },
      { root: "latest", action: "set", payload: { a: 1, b: 2 } },
      { root: "latest", action: "set", payload: { a: 7, b: 8 } },
      ...Array.from({ length: 120 }, (_, i) => ({
        root: `root-${i}`,
        action: "set",
        payload: { group: "candidate" },
      })),
    ];
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(() => append(entries)(session));
      await snapshot("snapshotted", { total: 1 });
      await snapshot("stale", { a: 1, b: 2 });
      await snapshot("fresh", { a: 1, b: 2 });
      await snapshot("unrelated", { a: 7, b: 8 });
      await snapshot("latest", { a: 1, b: 2 });
      await snapshot("latest", { a: 7, b: 8 }, 1, 1);
      for (let i = 0; i < 120; i++)
        await snapshot(`root-${i}`, { group: "candidate" });
      await session.withTransaction(() =>
        append([
          { root: "snapshotted", action: "add", payload: { amount: 2 } },
          { root: "stale", action: "set", payload: { a: 9 } },
        ])(session),
      );
      await mongoose.connection
        .collection("counts")
        .insertOne({ root: "zero", value: 0 });
    } finally {
      await session.endSession();
    }
  });
  const query = async (pairs) => {
    replayed = [];
    let result;
    await get({
      ...composition,
      eventStreamFn: (options) => {
        replayed.push(options.query["headers.root"]);
        return composition.eventStreamFn(options);
      },
    })(
      { params: {}, query: { pairs: JSON.stringify(pairs) } },
      {
        send: (value) => {
          result = value;
        },
      },
    );
    return result;
  };
  it("finds split-event state and fresh snapshot matches without replaying unrelated fresh roots", async () => {
    const results = await query([
      { key: "a", value: 1 },
      { key: "b", value: 2 },
    ]);
    assert.deepEqual(results.map(({ headers }) => headers.root).sort(), [
      "assembled",
      "fresh",
    ]);
    assert.ok(!replayed.includes("unrelated"));
    assert.ok(!replayed.some((root) => root.startsWith("root-")));
    assert.equal(replayed.filter((root) => root === "stale").length, 1);
  });
  it("matches reducer-derived state from dirty and unsnapshotted roots", async () => {
    const results = await query([{ key: "total", value: 3 }]);
    assert.deepEqual(results.map(({ headers }) => headers.root).sort(), [
      "derived",
      "snapshotted",
    ]);
    assert.ok(!replayed.includes("fresh"));
    assert.ok(!replayed.includes("latest"));
    assert.ok(!replayed.includes("unrelated"));
  });
  it("streams only counts beyond the latest snapshot's zero-based event number", async () => {
    const roots = [];
    await composition.rootStreamFn({
      unsnapshottedOnly: true,
      fn: async ({ root }) => roots.push(root),
    });
    assert.deepEqual(roots.sort(), [
      "assembled",
      "derived",
      "snapshotted",
      "stale",
    ]);
  });
  it("returns more than100 fresh snapshot matches without relying on dirty roots", async () => {
    assert.equal(
      (await query([{ key: "group", value: "candidate" }])).length,
      120,
    );
    assert.equal(
      replayed.filter((root) => root.startsWith("root-")).length,
      120,
    );
    assert.ok(!replayed.includes("unrelated"));
  });
  it("returns all existing aggregates for an empty query", async () => {
    assert.equal((await query([])).length, 127);
    assert.ok(replayed.includes("unrelated"));
  });
  it("compares typed scalar predicates strictly even when the schema could cast them", async () => {
    assert.deepEqual(await query([{ key: "a", value: "1" }]), []);
    assert.deepEqual(await query([{ key: "a", value: "not-a-number" }]), []);
  });
});
