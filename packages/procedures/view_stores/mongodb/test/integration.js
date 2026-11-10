import assert from "node:assert/strict";
import mongoose from "mongoose";
import server, { __resetStoresForTest } from "../index.js";
import deps from "../deps.js";

const uri = process.env.BLOSSM_TEST_MONGODB_URI;
const integration = uri ? describe : describe.skip;

integration("MongoDB view store startup", function () {
  this.timeout(30000);
  const environment = { ...process.env };
  const viewStore = deps.viewStore;
  let connected = false;

  before(async () => {
    assert.match(
      uri,
      /^mongodb:\/\/127\.0\.0\.1:\d+\/\?replicaSet=[A-Za-z0-9_-]+$/
    );
    process.env.CONTEXT = "tenant";
    for (const key of [
      "MONGODB_PROTOCOL",
      "MONGODB_USER",
      "MONGODB_HOST",
      "MONGODB_DATABASE",
    ])
      delete process.env[key];
    __resetStoresForTest();
    await mongoose.connect(uri, {
      dbName: `blossm_view_startup_${process.pid}_${Date.now()}`,
      serverSelectionTimeoutMS: 5000,
    });
    connected = true;
  });

  after(async () => {
    try {
      if (connected) await mongoose.connection.dropDatabase();
    } finally {
      await mongoose.disconnect();
      mongoose.deleteModel(/.*/);
      __resetStoresForTest();
      deps.viewStore = viewStore;
      for (const key of Object.keys(process.env))
        if (!(key in environment)) delete process.env[key];
      Object.assign(process.env, environment);
    }
  });

  it("starts with one unique view-ID index and rejects duplicate IDs", async () => {
    let serving = false;
    deps.viewStore = () => {
      serving = true;
    };
    await server({
      schema: { value: Number },
      secretFn: async () => undefined,
    });
    assert.equal(serving, true);
    const model = mongoose.model("views");
    const indexes = (await model.collection.indexes()).filter(
      ({ key }) => Object.keys(key).length === 1 && key["headers.id"] === 1
    );
    assert.equal(indexes.length, 1);
    assert.equal(indexes[0].unique, true);
    const view = {
      headers: {
        id: "same-id",
        context: {
          root: "A",
          domain: "tenant",
          service: "core",
          network: "local",
        },
      },
      body: { value: 1 },
    };
    await model.create(view);
    await assert.rejects(model.create(view), (error) => error.code === 11000);
  });
});
