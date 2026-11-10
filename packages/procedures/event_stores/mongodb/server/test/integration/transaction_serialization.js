import assert from "node:assert/strict";
import hash from "@blossm/hash";
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

  const append = (names, tx = { id: "multi-root" }) =>
    postTransaction({
      normalizeTransactionFn: composition.normalizeTransactionFn,
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
      tx,
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

  it("preserves transaction metadata and its committed hash after Mongo readback", async () => {
    const tx = {
      id: "metadata-roundtrip",
      ip: "127.0.0.1",
      claims: {
        exp: 1700000000,
        iat: 1600000000,
        aud: "one",
        custom: { role: "reader" },
      },
      path: [
        {
          name: "command",
          network: "local",
          host: "localhost",
          procedure: "command",
          hash: "trace-hash",
          issued: "2026-11-10T00:00:00.000Z",
          extra: "trace",
        },
      ],
    };
    await session.withTransaction(() => append(["metadata"], tx));
    const saved = await events.findOne({ "tx.id": tx.id }).lean();
    assert.deepEqual(saved.tx, tx);
    assert.equal(saved.headers.tHash, hash(tx).create());
    assert.equal(hash(saved.tx).create(), saved.headers.tHash);
  });

  it("casts transaction fields once before hashing, with custom claims and array audiences retained", async () => {
    const input = {
      id: 123,
      claims: { exp: "1700000000", aud: ["one", "two"], custom: { empty: {} } },
      path: [
        {
          network: "local",
          host: "localhost",
          procedure: "command",
          hash: "trace",
          issued: "2026-11-10",
          extra: true,
        },
      ],
    };
    await session.withTransaction(() => append(["normalized"], input));
    const saved = await events.findOne({ "tx.id": "123" }).lean();
    assert.deepEqual(saved.tx, {
      ...input,
      id: "123",
      claims: { ...input.claims, exp: 1700000000 },
      path: [{ ...input.path[0], issued: "2026-11-10T00:00:00.000Z" }],
    });
    assert.equal(saved.headers.tHash, hash(saved.tx).create());
    assert.notEqual(saved.headers.tHash, hash(input).create());
  });

  it("rejects invalid claims and missing required trace fields before reserving counts", async () => {
    const trace = {
      network: "local",
      host: "localhost",
      procedure: "command",
      hash: "trace",
    };
    const invalid = [
      { claims: { exp: "not-a-number" }, path: [] },
      { claims: { aud: ["one", 2] }, path: [] },
      { path: [{ ...trace, issued: "not-a-date" }] },
      ...Object.keys(trace).map((field) => {
        const path = { ...trace };
        delete path[field];
        return { path: [path] };
      }),
    ];
    for (const tx of invalid) {
      await assert.rejects(
        session.withTransaction(() => append(["invalid"], tx)),
        /Invalid transaction metadata/
      );
    }
    assert.equal(roots.length, 0);
    assert.equal(await counts.countDocuments(), 0);
    assert.equal(await events.countDocuments(), 0);
    assert.equal(await publications.countDocuments(), 0);
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
