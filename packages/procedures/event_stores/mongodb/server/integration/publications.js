import assert from "node:assert/strict";
import mongoose from "mongoose";
import post from "../../../generic/post/index.js";
import postTransaction from "../../../generic/post_transaction/index.js";
import createBlock from "../../../generic/create_block/index.js";
import server from "../index.js";
import serverDeps from "../deps.js";
import publicationsDeps from "../src/publications_deps.js";

const uri = process.env.BLOSSM_TEST_MONGODB_URI;
if (!/^mongodb:\/\/127\.0\.0\.1:\d+\//.test(uri || ""))
  throw new Error(
    "Set BLOSSM_TEST_MONGODB_URI to an isolated localhost replica set."
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
const database = `blossm_outbox_${process.pid}_${Date.now()}`;
await mongoose.connect(uri, {
  dbName: database,
  serverSelectionTimeoutMS: 5000,
});
const originalServer = serverDeps.eventStore;
let delivered = 0;
let failPublish = false;
let checks = 0;
try {
  let composition;
  serverDeps.eventStore = (options) => {
    composition = options;
  };
  await server({
    schema: { amount: Number },
    handlers: { set: (state, payload) => ({ ...state, ...payload }) },
    secretFn: async () => undefined,
    publishFn: async () => {
      if (failPublish) throw new Error("pubsub unavailable");
      delivered++;
    },
    signFn: async () => "signature",
    blockPublisherPublicKeyFn: async () => "public-key",
    isPublic: true,
  });
  const eventStore = mongoose.model("events");
  const publicationsStore = mongoose.model("publications");
  const countsStore = mongoose.model("counts");
  const event = (id) => ({
    headers: {
      root: id,
      action: "set",
      domain: "audit",
      service: "events",
      network: "local",
      topic: "events",
      version: 1,
      created: new Date().toISOString(),
      idempotency: id,
    },
    payload: { amount: 1 },
  });
  const append = (id, transaction) =>
    postTransaction({
      eventData: [{ event: event(id) }],
      saveEventsFn: composition.saveEventsFn,
      reserveRootCountsFn: composition.reserveRootCountsFn,
      tx: { id },
    })(transaction);
  const handler = post(composition);
  const block = async () => {
    let result;
    await createBlock(composition)(
      {},
      {
        send(value) {
          result = value;
        },
      }
    );
    return result;
  };

  await assert.rejects(
    composition.createTransactionFn(async (transaction) => {
      await append("aborted", transaction);
      throw new Error("abort transaction");
    }),
    /abort transaction/
  );
  assert.equal(await eventStore.countDocuments(), 0);
  assert.equal(await publicationsStore.countDocuments(), 0);
  assert.equal(await countsStore.countDocuments(), 0);
  checks++;

  failPublish = true;
  const request = {
    body: { eventData: [{ event: event("retry") }], tx: { id: "retry" } },
  };
  await assert.rejects(
    handler(request, { sendStatus() {} }),
    /pubsub unavailable/
  );
  assert.equal(await eventStore.countDocuments(), 1);
  assert.equal(await publicationsStore.countDocuments(), 1);
  failPublish = false;
  await handler(request, { sendStatus() {} });
  assert.equal(await eventStore.countDocuments(), 1);
  assert.equal(
    await countsStore.findOne({ root: "retry" }).then(({ value }) => value),
    1
  );
  assert.equal(await publicationsStore.countDocuments(), 0);
  assert.equal(delivered, 1);
  checks++;

  // A process may stop after append commits but before it calls the dispatcher.
  await composition.createTransactionFn((transaction) =>
    append("crash", transaction)
  );
  assert.equal(await publicationsStore.countDocuments(), 1);
  const genesis = await block();
  assert.equal(genesis.headers.sCount, 0);
  assert.equal(await publicationsStore.countDocuments(), 0);
  assert.equal(delivered, 2);
  checks++;

  const collisionHash = "outbox-collision";
  await publicationsStore.create({
    hash: collisionHash,
    created: new Date(),
    topic: "events",
    data: { root: "seed" },
  });
  const cloned = await eventStore.findOne().lean();
  delete cloned._id;
  cloned.hash = collisionHash;
  cloned.headers = {
    ...cloned.headers,
    root: "collision",
    nonce: "collision_0",
    idempotency: "collision",
  };
  await assert.rejects(
    composition.createTransactionFn(async (transaction) => {
      await composition.reserveRootCountsFn({
        root: "collision",
        amount: 1,
        transaction,
      });
      await composition.saveEventsFn({ events: [cloned], transaction });
    }),
    (err) => err.statusCode === 412 && err.message === "Duplicates."
  );
  assert.equal(
    await eventStore.countDocuments({ "headers.root": "collision" }),
    0
  );
  assert.equal(await countsStore.countDocuments({ root: "collision" }), 0);
  assert.equal(
    await publicationsStore.countDocuments({ hash: collisionHash }),
    1
  );
  await publicationsStore.deleteOne({ hash: collisionHash });
  checks++;

  await composition.createTransactionFn((transaction) =>
    append("ack-before-delete", transaction)
  );
  const db = publicationsDeps.db;
  publicationsDeps.db = {
    ...db,
    remove: async () => {
      throw new Error("delete unavailable");
    },
  };
  try {
    await assert.rejects(block(), /delete unavailable/);
  } finally {
    publicationsDeps.db = db;
  }
  assert.equal(await publicationsStore.countDocuments(), 1);
  const empty = await block();
  assert.equal(empty.headers.eCount, 0);
  assert.equal(empty.headers.sCount, 0);
  assert.equal(await publicationsStore.countDocuments(), 0);
  assert.equal(delivered, 4);
  checks++;
  console.log(`${checks} real MongoDB composed outbox checks passed`);
} finally {
  serverDeps.eventStore = originalServer;
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
}
