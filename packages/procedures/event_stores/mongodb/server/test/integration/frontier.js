import { expect } from "chai";
import { rejects } from "node:assert/strict";
import mongoose from "mongoose";
import setup from "./setup.js";
import create from "../../../../generic/create_block_transaction/index.js";
import latestBlock from "../../../latest_block/index.js";
import rootStream from "../../../root_stream/index.js";
import findOneSnapshot from "../../../find_one_snapshot/index.js";
import eventStream from "../../../event_stream/index.js";
import saveSnapshot from "../../../save_snapshot/index.js";
import saveBlock from "../../../save_block/index.js";
import { decode } from "../../../../../../lib/rlp/index.js";

describe("MongoDB durable block frontier", function () {
  this.timeout(30000);
  setup();
  let events, counts, snapshots, blocks, configuration;

  before(async () => {
    const model = (name, indexes = []) => {
      const schema = new mongoose.Schema(
        { events: Buffer, snapshots: Buffer, txs: Buffer },
        { strict: false, minimize: false, versionKey: false }
      );
      for (const index of indexes) schema.index(index, { unique: true });
      return mongoose.model(name, schema, name);
    };
    events = model("frontier_events", [{ "headers.root": 1, "headers.number": 1 }]);
    counts = model("frontier_counts", [{ root: 1 }]);
    snapshots = model("frontier_snapshots", [{ "headers.nonce": 1 }]);
    blocks = model("frontier_blocks", [{ "headers.number": 1 }]);
    await Promise.all([events.init(), counts.init(), snapshots.init(), blocks.init()]);
    configuration = {
      latestBlockFn: latestBlock({ blockchainStore: blocks }),
      rootStreamFn: rootStream({ countsStore: counts }),
      findOneSnapshotFn: findOneSnapshot({ snapshotStore: snapshots }),
      eventStreamFn: eventStream({ eventStore: events }),
      saveSnapshotFn: saveSnapshot({ snapshotStore: snapshots }),
      saveBlockFn: saveBlock({ blockchainStore: blocks }),
      handlers: { add: (state, {amount}) => ({amount: (state.amount || 0) + amount}) },
      signFn: async () => "local-test-signature",
      blockPublisherPublicKeyFn: async () => "local-test-key",
      isPublic: true,
      blockLimit: 100,
    };
  });

  const build = async (overrides = {}) => {
    const session = await mongoose.startSession();
    try {
      return await session.withTransaction(() => create({...configuration, ...overrides})(session));
    } finally {
      await session.endSession();
    }
  };
  const append = async (number, amount, session) => {
    const updated = "2021-01-01T00:00:00.000Z";
    await events.create([{
      hash: `event-${number}`,
      headers: { root: "late", number, action: "add", created: updated },
      payload: { amount }, context: {}, tx: { id: `tx-${number}` },
    }], { session });
    await counts.updateOne({root: "late"}, {$set: {value: number, updated}}, {upsert: true, session});
  };
  const exportedEvents = block => decode(Buffer.from(block.events.value?.() || block.events)).map(([, value]) => JSON.parse(Buffer.from(value).toString()));

  beforeEach(async () => {
    await Promise.all([events, counts, snapshots, blocks].map(model => model.deleteMany({})));
    await build();
  });

  it("includes a late commit after an empty block exactly once", async () => {
    const held = await mongoose.startSession();
    try {
      held.startTransaction();
      await append(1, 7, held);
      const empty = await build();
      expect(empty.block.headers.eCount).to.equal(0);
      expect(await snapshots.countDocuments()).to.equal(0);
      await held.commitTransaction();
      const included = await build();
      expect(exportedEvents(included.block).map(event => event.hash)).to.deep.equal(["event-1"]);
      const snapshot = await snapshots.findOne({"headers.root": "late"}).lean();
      expect(snapshot.headers.lastEventNumber).to.equal(1);
      expect(snapshot.state).to.deep.equal({amount: 7});
      expect((await build()).block.headers.eCount).to.equal(0);
    } finally {
      if (held.inTransaction()) await held.abortTransaction();
      await held.endSession();
    }
  });

  it("rolls snapshot progress back with a failed block and includes it on retry", async () => {
    await append(1, 7);
    const prior = await configuration.latestBlockFn();
    const rollback = new Error("force block rollback after snapshot write");
    await rejects(build({saveBlockFn: async () => {throw rollback;}}), error => error === rollback);
    expect((await configuration.latestBlockFn()).headers.number).to.equal(prior.headers.number);
    expect(await snapshots.countDocuments()).to.equal(0);
    expect((await build()).block.headers.eCount).to.equal(1);
    expect((await snapshots.findOne().lean()).state).to.deep.equal({amount: 7});
  });

  it("retries contending builders from the same predecessor without duplicate inclusion", async () => {
    await append(1, 7);
    let arrivals = 0;
    let release;
    const bothRead = new Promise(resolve => {release = resolve;});
    const initialNumbers = [];
    const contendedLatest = async options => {
      const latest = await configuration.latestBlockFn(options);
      if (arrivals < 2) {
        initialNumbers.push(latest.headers.number);
        if (++arrivals === 2) release();
        await bothRead;
      }
      return latest;
    };
    // Mocha's timeout bounds the barrier; later driver retries proceed normally.
    const contenders = await Promise.all([
      build({latestBlockFn: contendedLatest}), build({latestBlockFn: contendedLatest}),
    ]);
    expect(initialNumbers).to.have.length(2);
    expect(initialNumbers[0]).to.equal(initialNumbers[1]);
    expect(contenders.reduce((sum, {block}) => sum + block.headers.eCount, 0)).to.equal(1);
    const sequence = (await blocks.find().sort({"headers.number": 1}).lean()).map(({headers}) => headers.number);
    expect(sequence).to.deep.equal(sequence.map((_, i) => i));
  });

  it("uses snapshot sequence when creation timestamps reverse", async () => {
    await append(1, 7);
    await build();
    await append(2, 5);
    await build();
    await snapshots.updateOne({"headers.lastEventNumber": 2}, {$set: {"headers.created": "2019-01-01T00:00:00.000Z"}});
    expect((await build()).block.headers.eCount).to.equal(0);
    expect((await configuration.findOneSnapshotFn({query: {}, sort: {"headers.number": -1}})).state).to.deep.equal({amount: 12});
  });
});
