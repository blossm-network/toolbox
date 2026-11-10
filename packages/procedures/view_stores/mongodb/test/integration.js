import assert from "node:assert/strict";
import mongoose from "mongoose";
import server, { __resetStoresForTest } from "../index.js";
import deps from "../deps.js";
import del from "../../generic/delete/index.js";
import put from "../../generic/put/index.js";
import composeUpdate from "../../../../lib/compose_update/index.js";
import { load } from "../../../../cli/blossm/test/load.js";

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
    deps.viewStore = (options) => {
      composition = options;
    };
    await server({
      schema: {
        value: Number,
        email: String,
        enabled: Boolean,
        optional: String,
        title: String,
        status: String,
        items: [{ id: String, label: String }],
      },
      indexes: [
        [
          { email: 1 },
          { unique: true, partialFilterExpression: { "body.enabled": true } },
        ],
        [{ optional: 1 }, { sparse: true }],
        [{ title: "text" }, { name: "custom-search", weights: { title: 3 } }],
        [{ title: 1 }, { unique: true, sparse: true }],
      ],
      secretFn: async () => undefined,
    });
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
    assert.equal(typeof composition.writeFn, "function");
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

  it("preserves generated ID guards and element filters through actual Mongo mutations", async () => {
    const model = mongoose.model("views");
    const context = { root: "A", service: "core", network: "local" };
    await model.create({
      headers: { id: "guarded", context: { ...context, domain: "tenant" } },
      body: {
        status: "inactive",
        items: [
          { id: "first", label: "old" },
          { id: "second", label: "old" },
        ],
      },
    });
    let notifications = 0;
    const run = async (operation, push = false) => {
      const dispatch = async (handler, request) => {
        let statusCode, body;
        await handler(request, {
          status: (code) => ({
            send: (value) => {
              statusCode = code;
              body = value;
            },
          }),
          sendStatus: (code) => {
            statusCode = code;
          },
        });
        return { statusCode, ...(body && { body }) };
      };
      const projection = await load(
        "blossm/src/projection/deploy/src/index.js",
        {
          projection: (options) => options,
          config: { name: "example", context: "tenant" },
          process: { env: { CONTEXT: "tenant", NODE_ENV: "local" } },
          composeUpdate,
          handlers: { core: { example: () => ({ ...operation, context }) } },
          viewStore: () => ({
            set: ({ context }) => ({
              update: (body) =>
                dispatch(
                  put({
                    writeFn: composition.writeFn,
                    formatFn: ({ body }) => body,
                  }),
                  { params: { id: body.id }, body: { ...body, context } }
                ),
              delete: (id, { query }) =>
                dispatch(del({ removeFn: composition.removeFn }), {
                  params: { id },
                  query: { query, context },
                }),
            }),
          }),
          gcpToken: () => {},
          gcpSecret: {},
          gcpQueue: { enqueue() {} },
          command: () => {
            notifications++;
            throw new Error("No-op must not notify");
          },
          logger: { error() {} },
        }
      );
      await projection.mainFn({
        aggregate: {
          headers: { service: "core", domain: "example", root: "root" },
        },
        push,
      });
    };
    await run(
      {
        id: "guarded",
        query: { status: "active" },
        update: { status: "changed" },
      },
      true
    );
    assert.equal(
      (await model.findOne({ "headers.id": "guarded" }).lean()).body.status,
      "inactive"
    );
    assert.equal(notifications, 0);
    await run(
      {
        id: "missing",
        query: { status: "active" },
        update: { status: "changed" },
      },
      true
    );
    assert.equal(await model.countDocuments({ "headers.id": "missing" }), 0);
    await run({
      id: "guarded",
      query: { status: "inactive" },
      update: { status: "active" },
    });
    assert.equal(
      (await model.findOne({ "headers.id": "guarded" }).lean()).body.status,
      "active"
    );
    await run({
      id: "guarded",
      query: { status: "active" },
      update: { $set: { "items.$[item].label": "new" } },
      arrayFilters: [{ "item.id": "first" }],
    });
    assert.deepEqual(
      (await model.findOne({ "headers.id": "guarded" }).lean()).body.items.map(
        ({ label }) => label
      ),
      ["new", "old"]
    );
    await run({ id: "created", update: { status: "created" } });
    assert.equal(await model.countDocuments({ "headers.id": "created" }), 1);
    await run({ id: "guarded", query: { status: "inactive" }, del: true });
    assert.equal(await model.countDocuments({ "headers.id": "guarded" }), 1);
    await run({ id: "guarded", query: { status: "active" }, del: true });
    assert.equal(await model.countDocuments({ "headers.id": "guarded" }), 0);
  });

  it("enforces configured partial uniqueness and retains sparse/text index options", async () => {
    const model = mongoose.model("views");
    const indexes = await model.collection.indexes();
    const email = indexes.find(({ key }) => key["body.email"] === 1);
    assert.equal(email.unique, true);
    assert.deepEqual(email.partialFilterExpression, { "body.enabled": true });
    assert.equal(
      indexes.find(({ key }) => key["body.optional"] === 1).sparse,
      true
    );
    assert.equal(
      indexes.find(({ name }) => name === "custom-search").weights[
        "body.title"
      ],
      3
    );
    const title = indexes.filter(({ key }) => key["body.title"] === 1);
    assert.equal(title.length, 1);
    assert.equal(title[0].unique, true);
    assert.equal(title[0].sparse, true);
    const row = (id, enabled, title) => ({
      headers: {
        id,
        context: {
          root: "A",
          domain: "tenant",
          service: "core",
          network: "local",
        },
      },
      body: { email: "same@example.invalid", enabled, title },
    });
    await model.create(row("index-one", true, "alpha"));
    await assert.rejects(
      model.create(row("index-two", true, "beta")),
      (error) => error.code === 11000 && error.keyPattern["body.email"] === 1
    );
    await model.create(row("index-three", false, "gamma"));
    await model.create(row("index-four", false, "delta"));
    await assert.rejects(
      model.create(row("index-five", false, "alpha")),
      (error) => error.code === 11000 && error.keyPattern["body.title"] === 1
    );
    assert.equal(
      await model.countDocuments({ $text: { $search: "alpha" } }),
      1
    );
  });
});
