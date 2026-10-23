// Run explicitly with BLOSSM_TEST_MONGODB_URI pointing at a disposable localhost replica set.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import create from "../../../generic/create_block_transaction/index.js";
import latestBlock from "../../latest_block/index.js";
import rootStream from "../../root_stream/index.js";
import findOneSnapshot from "../../find_one_snapshot/index.js";
import eventStream from "../../event_stream/index.js";
import saveSnapshot from "../../save_snapshot/index.js";
import saveBlock from "../../save_block/index.js";
import { decode } from "../../../../../lib/rlp/index.js";

const uri = process.env.BLOSSM_TEST_MONGODB_URI;
assert(uri, "Set BLOSSM_TEST_MONGODB_URI to a disposable localhost replica set.");
assert(
  ["localhost", "127.0.0.1", "[::1]"].includes(new URL(uri).hostname),
  "Only localhost test databases are permitted."
);
const database = `blossm_frontier_${randomUUID().replaceAll("-", "")}`;
const connection = await mongoose
  .createConnection(uri, { dbName: database })
  .asPromise();
const environment = {
  DOMAIN: process.env.DOMAIN,
  SERVICE: process.env.SERVICE,
  NETWORK: process.env.NETWORK,
};
Object.assign(process.env, {
  DOMAIN: "integration",
  SERVICE: "frontier",
  NETWORK: "local",
});

try {
  const model = (name, indexes = []) => {
    const schema = new mongoose.Schema(
      { events: Buffer, snapshots: Buffer, txs: Buffer },
      { strict: false, minimize: false, versionKey: false }
    );
    for (const index of indexes) schema.index(index, { unique: true });
    return connection.model(name, schema, name);
  };
  const events = model("events", [{ "headers.root": 1, "headers.number": 1 }]);
  const counts = model("counts", [{ root: 1 }]);
  const snapshots = model("snapshots", [{ "headers.nonce": 1 }]);
  const blocks = model("blocks", [{ "headers.number": 1 }]);
  await Promise.all([
    events.init(),
    counts.init(),
    snapshots.init(),
    blocks.init(),
  ]);

  const configuration = {
    latestBlockFn: latestBlock({ blockchainStore: blocks }),
    rootStreamFn: rootStream({ countsStore: counts }),
    findOneSnapshotFn: findOneSnapshot({ snapshotStore: snapshots }),
    eventStreamFn: eventStream({ eventStore: events }),
    saveSnapshotFn: saveSnapshot({ snapshotStore: snapshots }),
    saveBlockFn: saveBlock({ blockchainStore: blocks }),
    handlers: {
      add: (state, { amount }) => ({ amount: (state.amount || 0) + amount }),
    },
    signFn: async () => "local-test-signature",
    blockPublisherPublicKeyFn: async () => "local-test-key",
    isPublic: true,
    blockLimit: 100,
  };
  const build = async (overrides = {}) => {
    const session = await connection.startSession();
    try {
      return await session.withTransaction(() =>
        create({ ...configuration, ...overrides })(session)
      );
    } finally {
      await session.endSession();
    }
  };
  const append = async (number, amount, session) => {
    const updated = "2021-01-01T00:00:00.000Z";
    await events.create(
      [
        {
          hash: `event-${number}`,
          headers: { root: "late", number, action: "add", created: updated },
          payload: { amount },
          context: {},
          tx: { id: `tx-${number}` },
        },
      ],
      { session }
    );
    await counts.updateOne(
      { root: "late" },
      { $set: { value: number, updated } },
      { upsert: true, session }
    );
  };

  await build(); // Genesis.
  const held = await connection.startSession();
  try {
    held.startTransaction();
    await append(1, 7, held);
    const empty = await build();
    assert.equal(empty.block.headers.eCount, 0);
    assert.equal(await snapshots.countDocuments(), 0);
    await held.commitTransaction();
    const included = await build();
    assert.equal(included.block.headers.eCount, 1);
    assert(included.block.headers.end >= empty.block.headers.end);
    const encodedEvents = decode(
      Buffer.from(included.block.events.value?.() || included.block.events)
    );
    assert.equal(encodedEvents.length, 1);
    assert.equal(
      JSON.parse(Buffer.from(encodedEvents[0][1]).toString()).hash,
      "event-1"
    );
    const snapshot = await snapshots.findOne({ "headers.root": "late" }).lean();
    assert.equal(snapshot.headers.lastEventNumber, 1);
    assert.deepEqual(snapshot.state, { amount: 7 });
    assert.equal((await build()).block.headers.eCount, 0);
    console.log(
      "PASS late commit survives an intervening empty block, snapshot frontier prevents duplicate inclusion"
    );
  } finally {
    if (held.inTransaction()) await held.abortTransaction();
    await held.endSession();
  }

  await append(2, 5);
  const priorBlock = await configuration.latestBlockFn();
  const rollback = new Error("force block rollback after snapshot write");
  await assert.rejects(
    build({
      saveBlockFn: async () => {
        throw rollback;
      },
    }),
    (err) => err === rollback
  );
  assert.equal(
    (await configuration.latestBlockFn()).headers.number,
    priorBlock.headers.number
  );
  assert.equal(
    await snapshots.countDocuments({ "headers.lastEventNumber": 2 }),
    0
  );
  assert.equal((await build()).block.headers.eCount, 1);
  assert.deepEqual(
    (await snapshots.findOne({ "headers.lastEventNumber": 2 }).lean()).state,
    { amount: 12 }
  );
  console.log(
    "PASS failed block rolls back its snapshot and retry includes the unprocessed event"
  );

  await append(3, 11);
  let arrivals = 0;
  let release;
  const bothRead = new Promise((resolve) => {
    release = resolve;
  });
  const initialNumbers = [];
  const contendedLatest = async (options) => {
    const latest = await configuration.latestBlockFn(options);
    if (arrivals < 2) {
      initialNumbers.push(latest.headers.number);
      if (++arrivals == 2) release();
      await bothRead;
    }
    return latest;
  };
  const contenders = await Promise.allSettled([
    build({ latestBlockFn: contendedLatest }),
    build({ latestBlockFn: contendedLatest }),
  ]);
  assert.equal(initialNumbers.length, 2);
  assert.equal(initialNumbers[0], initialNumbers[1]);
  for (const result of contenders)
    assert.equal(result.status, "fulfilled", result.reason?.stack);
  assert.equal(
    contenders.reduce((sum, { value }) => sum + value.block.headers.eCount, 0),
    1
  );
  const latest = await snapshots
    .findOne({ "headers.lastEventNumber": 3 })
    .lean();
  assert.deepEqual(latest.state, { amount: 23 });
  const sequence = (
    await blocks.find().sort({ "headers.number": 1 }).lean()
  ).map(({ headers }) => headers.number);
  assert.deepEqual(
    sequence,
    sequence.map((_, i) => i)
  );
  console.log(
    "PASS contending block builders commit each event once and preserve contiguous block numbers"
  );

  // Snapshot sequence, rather than wall-clock creation, selects processed progress.
  await snapshots.updateOne(
    { "headers.lastEventNumber": 3 },
    { $set: { "headers.created": "2019-01-01T00:00:00.000Z" } }
  );
  assert.equal((await build()).block.headers.eCount, 0);
  console.log(
    "PASS an older snapshot timestamp does not rewind the processed sequence"
  );
} finally {
  await connection.dropDatabase();
  await connection.close();
  for (const [key, value] of Object.entries(environment)) {
    if (value == undefined) delete process.env[key];
    else process.env[key] = value;
  }
}
