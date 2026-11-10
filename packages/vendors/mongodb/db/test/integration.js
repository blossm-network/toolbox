import assert from "node:assert/strict";
import deps from "../deps.js";
import * as db from "../index.js";

// Opt in with a disposable localhost replica set; never target an application DB.
const uri = process.env.BLOSSM_TEST_MONGODB_URI;
const integration = uri ? describe : describe.skip;

integration("MongoDB adapter integration", function () {
  this.timeout(30000);
  let store;
  let connected = false;

  before(async () => {
    assert.match(
      uri,
      /^mongodb:\/\/127\.0\.0\.1:\d+\/\?replicaSet=[A-Za-z0-9_-]+$/
    );
    await deps.mongoose.connect(uri, {
      dbName: `blossm_adapter_test_${process.pid}_${Date.now()}`,
      serverSelectionTimeoutMS: 5000,
    });
    connected = true;
    store = db.store({
      name: "adapter_integration",
      schema: {
        key: { type: String, required: true },
        amount: Number,
        items: [{ value: Number }],
        meta: {},
      },
      indexes: [[{ key: 1 }, { unique: true }]],
    });
    await store.init();
  });

  after(async () => {
    try {
      if (connected) await deps.mongoose.connection.dropDatabase();
    } finally {
      await deps.mongoose.disconnect();
      deps.mongoose.deleteModel(/.*/);
    }
  });

  it("casts schema values, enforces indexes, updates arrays and streams projected rows", async () => {
    await db.create({
      store,
      data: {
        key: "one",
        amount: "1",
        items: [{ value: 2 }],
        meta: { nested: true },
        ignored: true,
      },
    });
    await assert.rejects(db.create({ store, data: { key: "one" } }), {
      code: 11000,
    });
    await assert.rejects(db.create({ store, data: { amount: "invalid" } }), {
      name: "ValidationError",
    });
    const updated = await db.write({
      store,
      query: { key: "one" },
      update: { $inc: { amount: 1 }, $set: { "items.$[item].value": 3 } },
      options: { returnDocument: "after", arrayFilters: [{ "item.value": 2 }] },
    });
    assert.equal(updated.amount, 2);
    assert.equal(updated.items[0].value, 3);
    assert.equal(updated.ignored, undefined);
    assert.deepEqual(updated.meta, { nested: true });
    await db.updateMany({ store, query: {}, update: { $inc: { amount: 1 } } });
    assert.equal(
      (await db.findOne({ store, query: { key: "one" } })).amount,
      3
    );
    const rows = [];
    await db
      .find({ store, query: {}, options: { lean: true } })
      .cursor()
      .eachAsync((row) => rows.push(row));
    assert.equal(rows.length, 1);
    assert.equal(rows[0]._id, undefined);
    const streamed = [];
    await db.forEach({ store, query: {}, fn: (row) => streamed.push(row.key) });
    assert.deepEqual(streamed, ["one"]);
    const aggregate = await db.aggregate({
      store,
      query: {},
      select: { amount: 1 },
    });
    assert.equal(aggregate[0].amount, 3);
    assert.equal(await db.count({ store, query: {} }), 1);
    await db.remove({ store, query: { key: "one" } });
    assert.equal(await db.count({ store, query: {} }), 0);
  });

  it("commits and rolls back writes through sessions", async () => {
    const session = await db.startSession();
    try {
      await session.withTransaction(() =>
        db.create({ store, data: { key: "committed" }, options: { session } })
      );
      await assert.rejects(
        session.withTransaction(async () => {
          await db.create({
            store,
            data: { key: "rolled-back" },
            options: { session },
          });
          throw new Error("abort test");
        }),
        /abort test/
      );
      assert.equal(await db.count({ store, query: { key: "committed" } }), 1);
      assert.equal(await db.count({ store, query: { key: "rolled-back" } }), 0);
    } finally {
      await session.endSession();
    }
  });
});
