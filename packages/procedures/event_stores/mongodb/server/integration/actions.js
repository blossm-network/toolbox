import assert from "node:assert/strict";
import { setTimeout, clearTimeout } from "node:timers";
import mongoose from "mongoose";
import createEvent from "../../../../../lib/create_event/index.js";
import hash from "../../../../../lib/hash/index.js";
import { COMMITTED, DUPLICATE } from "@blossm/event-outcome-consts";
import { QUEUED } from "@blossm/rpc-delivery-consts";
import post from "../../../generic/post/index.js";
import postTransaction from "../../../generic/post_transaction/index.js";
import createBlock from "../../../generic/create_block/index.js";
import server from "../index.js";
import serverDeps from "../deps.js";
import pendingDeps from "../src/pending_deps.js";

const uri = process.env.BLOSSM_TEST_MONGODB_URI;
if (
  !/^mongodb:\/\/127\.0\.0\.1:\d+\/\?replicaSet=[A-Za-z0-9_-]+$/.test(uri || "")
)
  throw new Error(
    "Set BLOSSM_TEST_MONGODB_URI to a disposable localhost replica set."
  );
Object.assign(process.env, {
  NODE_ENV: "audit",
  DOMAIN: "audit",
  SERVICE: "events",
  NETWORK: "local",
});
for (const key of [
  "MONGODB_PROTOCOL",
  "MONGODB_USER",
  "MONGODB_HOST",
  "MONGODB_DATABASE",
])
  delete process.env[key];
const database = `blossm_actions_${process.pid}_${Date.now()}`;
const checks = [];
await mongoose.connect(uri, {
  dbName: database,
  serverSelectionTimeoutMS: 5000,
});
const originalServer = serverDeps.eventStore;
const originalDb = pendingDeps.db;
const restoreRemove = originalDb.remove;
try {
  // The receiver atomically records the action ID and its business effect. Its
  // response is an acknowledgment of commitment, not HTTP or queue acceptance.
  const receipts = mongoose.model(
    "action_receipts",
    new mongoose.Schema(
      {
        id: { type: String, unique: true, required: true },
        intentHash: { type: String, required: true },
      },
      { versionKey: false }
    )
  );
  const effects = mongoose.model(
    "action_effects",
    new mongoose.Schema(
      {
        id: { type: String, unique: true, required: true },
        target: { type: String, required: true },
        amount: { type: Number, required: true },
      },
      { versionKey: false }
    )
  );
  let prepareFailure = false,
    failPublication = false,
    queueOnly = false,
    mismatchAck = false;
  let prepared = 0,
    received = 0,
    concurrentGate,
    concurrentId;
  const seen = [];
  const receiver = async (record) => {
    assert.equal(hash(record.intent).create(), record.intentHash);
    const intent = JSON.parse(record.intent);
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const existing = await receipts
          .findOne({ id: record.id })
          .session(session)
          .lean();
        if (existing) {
          assert.equal(
            existing.intentHash,
            record.intentHash,
            "action ID reused with different intent"
          );
          return;
        }
        await receipts.create(
          [{ id: record.id, intentHash: record.intentHash }],
          { session }
        );
        await effects.create([{ id: record.id, ...intent }], {
          session,
        });
      });
    } catch (error) {
      // A concurrent insertion can lose the unique-ID race without a transient
      // transaction label. Reconcile only against the durable receiver receipt.
      if (error.code !== 11000) throw error;
      const existing = await receipts.findOne({ id: record.id }).lean();
      assert(existing);
      assert.equal(
        existing.intentHash,
        record.intentHash,
        "action ID reused with different intent"
      );
    } finally {
      await session.endSession();
    }
    return { id: record.id, intentHash: record.intentHash };
  };
  let composition;
  serverDeps.eventStore = (options) => {
    composition = options;
  };
  await server({
    schema: { amount: Number },
    handlers: { set: (state, payload) => ({ ...state, ...payload }) },
    secretFn: async () => undefined,
    publishFn: async () => {
      if (failPublication) throw new Error("notification unavailable");
    },
    signFn: async () => "signature",
    blockPublisherPublicKeyFn: async () => "public-key",
    isPublic: true,
    actionsFn: (event) => {
      prepared++;
      if (prepareFailure) throw new Error("action preparation unavailable");
      return [{ target: event.headers.root, amount: event.payload.amount }];
    },
    deliverActionFn: async (record) => {
      received++;
      seen.push(record);
      if (queueOnly) return { delivery: QUEUED };
      if (mismatchAck) return { id: record.id, intentHash: "different-hash" };
      if (concurrentGate && record.id === concurrentId) await concurrentGate();
      return receiver(record);
    },
  });
  assert.equal(typeof composition.publishPendingFn, "function");
  const events = mongoose.model("events");
  const actions = mongoose.model("actions");
  const publications = mongoose.model("publications");
  const counts = mongoose.model("counts");
  await Promise.all(
    mongoose.modelNames().map((name) => mongoose.model(name).init())
  );
  const actionQuery = (target) => ({
    intent: JSON.stringify({ target, amount: 1 }),
  });
  const event = (root) =>
    createEvent({
      root,
      action: "set",
      domain: "audit",
      service: "events",
      network: "local",
      version: 1,
      idempotency: root,
      payload: { amount: 1 },
    });
  const append = (root, transaction) =>
    postTransaction({
      eventData: [{ event: event(root) }],
      tx: { id: root },
      saveEventsFn: composition.saveEventsFn,
      reserveRootCountsFn: composition.reserveRootCountsFn,
    })(transaction);
  const handler = post(composition);
  const submit = async (root) => {
    let result;
    await handler(
      { body: { eventData: [{ event: event(root) }], returnOutcomes: true } },
      {
        send(value) {
          result = value;
        },
        sendStatus() {},
      }
    );
    return result;
  };
  const block = () => createBlock(composition)({}, { send() {} });
  const assertMissing = async (root) => {
    assert.equal(await events.countDocuments({ "headers.root": root }), 0);
    assert.equal(await actions.countDocuments(actionQuery(root)), 0);
    assert.equal(await counts.countDocuments({ root }), 0);
    assert.equal(await publications.countDocuments({ "data.root": root }), 0);
  };

  await assert.rejects(
    composition.createTransactionFn(async (transaction) => {
      await append("abort", transaction);
      throw new Error("abort before commit");
    }),
    /abort before commit/
  );
  await assertMissing("abort");
  checks.push(
    "producer transaction abort leaves neither events, counts, notices nor action intents"
  );

  prepareFailure = true;
  await assert.rejects(
    submit("prepare-failure"),
    /action preparation unavailable/
  );
  prepareFailure = false;
  await assertMissing("prepare-failure");
  checks.push(
    "trusted action preparation failure rolls back the event and all pending work"
  );

  assert.deepEqual(await submit("duplicate"), { outcomes: [COMMITTED] });
  const before = prepared;
  assert.deepEqual(await submit("duplicate"), { outcomes: [DUPLICATE] });
  assert.equal(prepared, before);
  assert.equal(await effects.countDocuments({ target: "duplicate" }), 1);
  assert.equal(await actions.countDocuments(), 0);
  const record = seen.find(
    (entry) =>
      entry.intent === JSON.stringify({ target: "duplicate", amount: 1 })
  );
  assert.equal(record.id, `${record.eventHash}:0`);
  await assert.rejects(
    receiver({
      ...record,
      intent: JSON.stringify({ target: "changed", amount: 2 }),
      intentHash: hash(
        JSON.stringify({ target: "changed", amount: 2 })
      ).create(),
    }),
    /different intent/
  );
  assert.equal(await effects.countDocuments({ target: "changed" }), 0);
  checks.push(
    "duplicate producer submission creates no new intent; receiver rejects changed intent under the same ID"
  );

  await composition.createTransactionFn((transaction) =>
    append("crash", transaction)
  );
  assert.equal(await actions.countDocuments(actionQuery("crash")), 1);
  assert.equal(await effects.countDocuments({ target: "crash" }), 0);
  await block();
  assert.equal(await effects.countDocuments({ target: "crash" }), 1);
  assert.equal(await actions.countDocuments(actionQuery("crash")), 0);
  checks.push(
    "scheduled block recovery completes action committed before its dispatcher ran"
  );

  await composition.createTransactionFn((transaction) =>
    append("ack-before-delete", transaction)
  );
  const originalRemove = originalDb.remove;
  originalDb.remove = async (args) => {
    if (args.store.modelName === "actions")
      throw new Error("action deletion unavailable");
    return originalRemove(args);
  };
  await assert.rejects(
    composition.publishPendingFn(),
    /action deletion unavailable/
  );
  assert.equal(
    await actions.countDocuments(actionQuery("ack-before-delete")),
    1
  );
  assert.equal(
    await effects.countDocuments({ target: "ack-before-delete" }),
    1
  );
  originalDb.remove = originalRemove;
  await block();
  assert.equal(
    await effects.countDocuments({ target: "ack-before-delete" }),
    1
  );
  assert.equal(
    await actions.countDocuments(actionQuery("ack-before-delete")),
    0
  );
  checks.push(
    "receiver success before pending deletion retries safely with one business effect"
  );

  await composition.createTransactionFn((transaction) =>
    append("concurrent", transaction)
  );
  concurrentId = (await actions.findOne(actionQuery("concurrent")).lean()).id;
  let arrivals = 0,
    release;
  const together = new Promise((resolve) => {
    release = resolve;
  });
  concurrentGate = async () => {
    if (++arrivals === 2) release();
    await together;
  };
  let timeout;
  try {
    await Promise.race([
      Promise.all([
        composition.publishPendingFn(),
        composition.publishPendingFn(),
      ]),
      new Promise((resolve, reject) => {
        timeout = setTimeout(
          () => reject(new Error("concurrent drainers timed out")),
          5000
        );
      }),
    ]);
  } finally {
    clearTimeout(timeout);
    concurrentGate = undefined;
  }
  assert.equal(arrivals, 2);
  assert.equal(await effects.countDocuments({ target: "concurrent" }), 1);
  assert.equal(await actions.countDocuments(actionQuery("concurrent")), 0);
  checks.push(
    "overlapping drainers redeliver the same action while receiver commits one business effect"
  );

  await composition.createTransactionFn((transaction) =>
    append("ack-contract", transaction)
  );
  queueOnly = true;
  await assert.rejects(composition.publishPendingFn());
  queueOnly = false;
  assert.equal(await actions.countDocuments(actionQuery("ack-contract")), 1);
  assert.equal(await effects.countDocuments({ target: "ack-contract" }), 0);
  mismatchAck = true;
  await assert.rejects(composition.publishPendingFn());
  mismatchAck = false;
  assert.equal(await actions.countDocuments(actionQuery("ack-contract")), 1);
  await composition.publishPendingFn();
  assert.equal(await effects.countDocuments({ target: "ack-contract" }), 1);
  checks.push(
    "queue-only or mismatched acknowledgement retains the action until durable matching acknowledgement"
  );

  failPublication = true;
  await assert.rejects(submit("independent"), /notification unavailable/);
  assert.equal(await effects.countDocuments({ target: "independent" }), 1);
  assert.equal(await actions.countDocuments(actionQuery("independent")), 0);
  assert.equal(
    await publications.countDocuments({ "data.root": "independent" }),
    1
  );
  failPublication = false;
  await composition.publishPendingFn();
  assert.equal(await publications.countDocuments(), 0);
  checks.push(
    "notification failure does not starve durable actions and its notice later recovers"
  );

  console.log(
    JSON.stringify(
      {
        mongoVersion: (await mongoose.connection.db.admin().serverInfo())
          .version,
        mongooseVersion: mongoose.version,
        passingChecks: checks.length,
        checks,
        prepared,
        deliveries: received,
      },
      null,
      2
    )
  );
} finally {
  serverDeps.eventStore = originalServer;
  pendingDeps.db = originalDb;
  originalDb.remove = restoreRemove;
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
}
