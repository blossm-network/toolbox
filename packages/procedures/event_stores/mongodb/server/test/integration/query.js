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

describe("Complete persisted aggregate queries", function () {
  this.timeout(30000);
  setup();
  let composition;
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
      indexes: ["a", "b"],
      handlers,
      secretFn: async () => undefined,
    });
    const entries = [
      { root: "assembled", action: "set", payload: { a: 1 } },
      { root: "assembled", action: "set", payload: { b: 2 } },
      { root: "derived", action: "add", payload: { amount: 1 } },
      { root: "derived", action: "add", payload: { amount: 2 } },
      { root: "snapshotted", action: "add", payload: { amount: 1 } },
      ...Array.from({ length: 120 }, (_, i) => ({
        root: `root-${i}`,
        action: "set",
        payload: { group: "candidate" },
      })),
    ];
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(() => append(entries)(session));
      await composition.saveSnapshotFn({
        snapshot: {
          hash: "query-snapshot",
          headers: {
            root: "snapshotted",
            nonce: "snapshotted_0",
            block: 0,
            number: 0,
            cHash: "context",
            gHash: "groups",
            sHash: "state",
            pHash: "previous",
            created: new Date(0),
            isPublic: true,
            domain: "test",
            service: "events",
            network: "local",
            lastEventNumber: 0,
            eCount: 1,
            eRoot: "events",
            eSize: 1,
          },
          state: { total: 1 },
          context: {},
          groups: [],
          events: Buffer.alloc(0),
          txIds: [],
        },
      });
      await session.withTransaction(() =>
        append([
          { root: "snapshotted", action: "add", payload: { amount: 2 } },
        ])(session),
      );
    } finally {
      await session.endSession();
    }
  });
  const query = async (pairs) => {
    let result;
    await get(composition)(
      { params: {}, query: { pairs: JSON.stringify(pairs) } },
      {
        send: (value) => {
          result = value;
        },
      },
    );
    return result;
  };
  it("matches current state assembled across separate events", async () => {
    assert.deepEqual(
      (
        await query([
          { key: "a", value: 1 },
          { key: "b", value: 2 },
        ])
      ).map(({ headers }) => headers.root),
      ["assembled"],
    );
  });
  it("matches reducer-derived state and replays events after a snapshot", async () => {
    const results = await query([{ key: "total", value: 3 }]);
    assert.deepEqual(results.map(({ headers }) => headers.root).sort(), [
      "derived",
      "snapshotted",
    ]);
  });
  it("enumerates beyond100 matches and returns all roots for an empty query", async () => {
    assert.equal(
      (await query([{ key: "group", value: "candidate" }])).length,
      120,
    );
    assert.equal((await query([])).length, 123);
  });
});
