import assert from "node:assert/strict";
import { replace } from "sinon";
import mongoose from "mongoose";
import setup from "./setup.js";
import createEvent from "../../../../../../lib/create_event/index.js";
import postTransaction from "../../../../generic/post_transaction/index.js";
import createBlockTransaction from "../../../../generic/create_block_transaction/index.js";
import server from "../../index.js";
import deps from "../../deps.js";

describe("MongoDB transaction operation serialization", function () {
  this.timeout(30000);
  setup();
  let composition, session, counts, events, snapshots, publications;
  let active, maximum, roots;

  before(async () => {
    replace(deps, "eventStore", (options) => {
      composition = options;
    });
    await server({
      schema: { amount: Number },
      handlers: { set: (state, payload) => ({ ...state, ...payload }) },
      secretFn: async () => undefined,
      signFn: async () => "signature",
      blockPublisherPublicKeyFn: async () => "public-key",
      isPublic: true,
    });
    await Promise.all(
      mongoose.modelNames().map((name) => mongoose.model(name).init())
    );
    counts = mongoose.model("counts");
    events = mongoose.model("events");
    snapshots = mongoose.model("snapshots");
    publications = mongoose.model("publications");
    const write = counts.collection.findOneAndUpdate;
    replace(
      counts.collection,
      "findOneAndUpdate",
      async function (filter, update, options) {
        assert.equal(options.session, session);
        roots.push(filter.root);
        active++;
        maximum = Math.max(maximum, active);
        try {
          return await write.call(this, filter, update, options);
        } finally {
          active--;
        }
      }
    );
  });

  beforeEach(async () => {
    await Promise.all(
      mongoose.modelNames().map((name) => mongoose.model(name).deleteMany({}))
    );
    active = maximum = 0;
    roots = [];
    session = await mongoose.startSession();
  });
  // Keep session cleanup independent of the transaction wrapper under review.
  afterEach(async () => {
    await session.endSession();
  });

  const append = (names) =>
    postTransaction({
      eventData: names.map((root, index) => ({
        event: createEvent({
          root,
          action: "set",
          domain: "test",
          service: "events",
          network: "local",
          version: 1,
          idempotency: `${root}-${index}`,
          payload: { amount: index },
        }),
      })),
      reserveRootCountsFn: composition.reserveRootCountsFn,
      saveEventsFn: composition.saveEventsFn,
      tx: { id: "multi-root" },
    })(session);

  it("serializes real session counter writes in sorted order and commits per-root event numbers", async () => {
    await session.withTransaction(() => append(["z", "a", "z"]));
    assert.equal(maximum, 1);
    assert.deepEqual(roots, ["a", "z"]);
    assert.deepEqual(
      await counts
        .find({}, { _id: 0, root: 1, value: 1 })
        .sort({ root: 1 })
        .lean(),
      [
        { root: "a", value: 1 },
        { root: "z", value: 2 },
      ]
    );
    const saved = await events
      .find()
      .sort({ "headers.root": 1, "headers.number": 1 })
      .lean();
    assert.deepEqual(
      saved.map(({ headers }) => [headers.root, headers.number]),
      [
        ["a", 0],
        ["z", 0],
        ["z", 1],
      ]
    );
    assert.equal(await publications.countDocuments(), 3);
  });

  it("rolls back every root's counter, event and notice after a multi-root append", async () => {
    await assert.rejects(
      session.withTransaction(async () => {
        await append(["z", "a", "z"]);
        throw new Error("abort multi-root");
      }),
      /abort multi-root/
    );
    assert.equal(maximum, 1);
    assert.deepEqual(roots, ["a", "z"]);
    for (const store of [counts, events, publications])
      assert.equal(await store.countDocuments(), 0);
  });

  it("runs actual root cursor callbacks and session snapshot writes one at a time", async () => {
    await session.withTransaction(() => append(["z", "a", "m"]));
    const createBlock = createBlockTransaction({
      ...composition,
      blockLimit: 100,
    });
    await session.withTransaction(() => createBlock(session));
    let callbacks = 0,
      callbackActive = 0,
      callbackMaximum = 0,
      writes = 0;
    const block = createBlockTransaction({
      ...composition,
      blockLimit: 100,
      rootStreamFn: (options) =>
        composition.rootStreamFn({
          ...options,
          fn: async (root) => {
            callbacks++;
            callbackActive++;
            callbackMaximum = Math.max(callbackMaximum, callbackActive);
            try {
              return await options.fn(root);
            } finally {
              callbackActive--;
            }
          },
        }),
      saveSnapshotFn: async (options) => {
        assert.equal(options.transaction, session);
        writes++;
        return await composition.saveSnapshotFn(options);
      },
    });
    const result = await session.withTransaction(() => block(session));
    assert.equal(callbacks, 3);
    assert.equal(callbackMaximum, 1);
    assert.equal(writes, 3);
    assert.equal(result.block.headers.sCount, 3);
    assert.equal(await snapshots.countDocuments(), 3);
  });
});
