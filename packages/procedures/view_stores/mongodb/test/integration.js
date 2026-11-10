import assert from "node:assert/strict";
import mongoose from "mongoose";
import server, { __resetStoresForTest } from "../index.js";
import deps from "../deps.js";
import del from "../../generic/delete/index.js";

const uri = process.env.BLOSSM_TEST_MONGODB_URI;
const integration = uri ? describe : describe.skip;

integration("MongoDB view store startup", function () {
  this.timeout(30000);
  const environment = { ...process.env };
  const viewStore = deps.viewStore;
  let connected = false;
  let composition;

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
    deps.viewStore = (options) => {
      composition = options;
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

  it("deletes only the selected tenant's row and rejects unsafe selectors", async () => {
    const model = mongoose.model("views");
    const context = (root) => ({
      root,
      domain: "tenant",
      service: "core",
      network: "local",
    });
    await model.insertMany([
      {
        headers: { id: "tenant-b", context: context("B") },
        body: { value: 2 },
      },
      {
        headers: { id: "tenant-a", context: context("A") },
        body: { value: 2 },
      },
    ]);
    let result;
    const response = {
      status: (code) => {
        assert.equal(code, 200);
        return {
          send: (body) => {
            result = body;
          },
        };
      },
    };
    const handler = del({ removeFn: composition.removeFn });
    await handler(
      {
        params: {},
        query: {
          query: { value: 2 },
          context: { tenant: context("A") },
        },
      },
      response
    );
    assert.deepEqual(result, { deletedCount: 1 });
    assert.equal(await model.countDocuments({ "headers.id": "tenant-a" }), 0);
    assert.equal(await model.countDocuments({ "headers.id": "tenant-b" }), 1);
    await assert.rejects(
      handler(
        {
          params: {},
          query: {
            query: {},
            context: { tenant: context("B") },
          },
        },
        response
      ),
      (error) => error.statusCode === 400
    );
    await assert.rejects(
      handler({ params: { id: "tenant-b" }, query: {} }, response),
      (error) => error.statusCode === 403
    );
    assert.equal(await model.countDocuments({ "headers.id": "tenant-b" }), 1);
  });
});
