import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import databaseDeps from "@blossm/mongodb-database/deps.js";
import deps from "../deps.js";
import adapter, { __resetStoresForTest } from "../index.js";
import createProtocol from "../src/projection_session.js";
import play from "../../../projection/play/index.js";
import createSession from "../../../../cli/blossm/src/projection/deploy/src/session.js";

const suite = process.env.TEST_MONGODB_URL ? describe : describe.skip;
suite("Fenced projection sessions with a real Mongo replica set", function () {
  this.timeout(15000);
  let connection, model, protocol, persistence;
  const original = { ...deps };
  const oldContext = process.env.CONTEXT;
  const context = {
    tenant: { root: "tenant", service: "test", network: "test" },
  };
  const put = (id, update, extra = {}) => ({
    type: "put",
    id,
    body: { update, context },
    ...extra,
  });
  const remove = (id) => ({ type: "delete", id, context });
  const request = async ({ action, ...params }) => ({
    body: await protocol[action](params),
  });
  const sessionFn = (transport = request) =>
    createSession({ request: transport, pushFn: async () => {} });
  const seed = (id, body = {}) =>
    model.create({
      headers: { id, context: { ...context.tenant, domain: "tenant" } },
      body: { email: `${id}@example.invalid`, count: 0, ...body },
    });

  before(async () => {
    process.env.CONTEXT = "tenant";
    connection = await databaseDeps.mongoose
      .createConnection(process.env.TEST_MONGODB_URL, {
        dbName: `blossm_audit_views_${randomUUID().replace(/-/g, "")}`,
      })
      .asPromise();
    deps.db = {
      ...original.db,
      store: ({ schema, indexes, typeKey }) => {
        const definition = new databaseDeps.mongoose.Schema(schema, {
          typeKey,
          minimize: false,
        });
        for (const index of indexes) definition.index(...index);
        model = connection.model("views", definition, "views");
        return model;
      },
    };
    deps.viewStore = (options) => {
      persistence = options;
    };
    deps.projectionSession = async (options) => {
      protocol = await createProtocol(options);
      return protocol;
    };
    __resetStoresForTest();
    await adapter({
      consistency: "fenced",
      schema: {
        email: String,
        name: String,
        count: Number,
        items: [{ id: String, name: String }],
      },
      indexes: [[{ email: 1 }, { unique: true }], [{ name: "text" }]],
      secretFn: async () => "unused-test-secret",
    });
    await model.init();
  });
  beforeEach(async () => {
    await model.deleteMany({});
    await connection.db.collection("projection_receipts").deleteMany({});
    await connection.db
      .collection("projection_control")
      .updateOne(
        { _id: "destination" },
        { $set: { owner: null, expiresAt: new Date(0) } }
      );
  });
  after(async () => {
    Object.assign(deps, original);
    __resetStoresForTest();
    if (oldContext === undefined) delete process.env.CONTEXT;
    else process.env.CONTEXT = oldContext;
    if (connection) {
      await connection.dropDatabase();
      await connection.close();
    }
  });

  it("acquires the destination lease before source/fact reads and reruns a competing play", async () => {
    await seed("card");
    let release, entered;
    const gate = new Promise((resolve) => {
      release = resolve;
    });
    const started = new Promise((resolve) => {
      entered = resolve;
    });
    let reads = 0,
      facts = 1;
    const handler = play({
      sessionFn: sessionFn(),
      aggregateFn: async () => ({ state: ++reads }),
      readFactFn: async () => facts,
      mainFn: async ({ aggregate, aggregateFn, readFactFn, session }) => {
        await aggregateFn({ root: "related" });
        const value = await readFactFn();
        if (aggregate.state === 1) {
          entered();
          await gate;
        }
        session.add(put("card", { count: value }));
      },
    });
    const replayRequest = {
      body: {
        root: "source",
        domain: "test",
        service: "test",
        playId: "replay-child",
      },
    };
    const liveRequest = {
      body: {
        subscription: "live-subscription",
        message: {
          messageId: "live-message",
          data: Buffer.from(
            JSON.stringify({
              root: "source",
              domain: "test",
              service: "test",
              action: "updated",
            })
          ).toString("base64"),
        },
      },
    };
    const res = { sendStatus: () => {} };
    const first = handler(replayRequest, res);
    await started;
    await assert.rejects(handler(liveRequest, res), { statusCode: 409 });
    assert.equal(
      reads,
      2,
      "busy play must not read its triggering or related source"
    );
    release();
    await first;
    facts = 2;
    await handler(liveRequest, res);
    assert.equal(reads, 4);
    assert.equal((await model.findOne({ "headers.id": "card" })).body.count, 2);
  });

  it("commits an increment only once when the commit response is lost", async () => {
    await seed("counter");
    let loseResponse = true,
      transforms = 0;
    const transport = async (params) => {
      const result = await request(params);
      if (params.action === "commit" && loseResponse) {
        loseResponse = false;
        throw new Error("Commit response was lost");
      }
      return result;
    };
    const run = async (session) => {
      transforms++;
      session.add(put("counter", { $inc: { count: 1 } }));
    };
    await assert.rejects(
      sessionFn(transport)({ playId: "stable-increment", run }),
      /lost/
    );
    await sessionFn(transport)({ playId: "stable-increment", run });
    assert.equal(transforms, 1);
    assert.equal(
      (await model.findOne({ "headers.id": "counter" })).body.count,
      1
    );
  });

  it("rolls back all updates and deletes if any operation fails", async () => {
    await seed("counter");
    await seed("delete-me");
    const lease = await protocol.begin({ playId: "rollback" });
    await assert.rejects(
      protocol.commit({
        ...lease,
        operations: [
          put("counter", { $inc: { count: 1 } }),
          remove("delete-me"),
          put("counter", { count: "not-a-number" }),
        ],
      })
    );
    assert.equal(
      (await model.findOne({ "headers.id": "counter" })).body.count,
      0
    );
    assert.ok(await model.findOne({ "headers.id": "delete-me" }));
    assert.equal(
      await connection.db.collection("projection_receipts").countDocuments({}),
      0
    );
    await protocol.release(lease);
  });

  it("rejects expired owners after takeover and retains the newer result", async () => {
    await seed("counter");
    const old = await protocol.begin({ playId: "expired" });
    await connection.db
      .collection("projection_control")
      .updateOne({ _id: "destination" }, { $set: { expiresAt: new Date(0) } });
    const next = await protocol.begin({ playId: "new-owner" });
    assert.ok(next.generation > old.generation);
    await assert.rejects(protocol.renew(old), { statusCode: 409 });
    await protocol.commit({
      ...next,
      operations: [
        {
          ...put("counter", { count: 2 }),
          body: { update: { count: 2 }, context, groups: [] },
        },
      ],
    });
    await assert.rejects(
      protocol.commit({
        ...old,
        operations: [
          {
            ...put("counter", { count: 1 }),
            body: {
              update: { count: 1 },
              context,
              groups: [{ root: "revoked", service: "test", network: "test" }],
            },
          },
        ],
      }),
      { statusCode: 409 }
    );
    assert.equal(
      (await model.findOne({ "headers.id": "counter" })).body.count,
      2
    );
    assert.deepEqual(
      (await model.findOne({ "headers.id": "counter" })).headers.groups,
      []
    );
  });

  it("prevents lease takeover from passing an in-flight fenced commit", async () => {
    await seed("counter");
    let clock = new Date(),
      entered,
      release;
    const gate = new Promise((resolve) => {
      release = resolve;
    });
    const reached = new Promise((resolve) => {
      entered = resolve;
    });
    const controller = await createProtocol({
      store: model,
      enabled: true,
      now: () => clock,
      writeFn: async (params) => {
        const result = await persistence.writeFn(params);
        entered();
        await gate;
        return result;
      },
      removeFn: persistence.removeFn,
    });
    const first = await controller.begin({ playId: "in-flight" });
    const commit = controller.commit({
      ...first,
      operations: [put("counter", { count: 1 })],
    });
    await reached;
    clock = new Date(clock.getTime() + first.limits.leaseMilliseconds + 1);
    let acquired = false;
    const takeover = controller.begin({ playId: "takeover" }).then((lease) => {
      acquired = true;
      return lease;
    });
    try {
      await new Promise((resolve) => setTimeout(resolve, 30));
      assert.equal(acquired, false);
    } finally {
      release();
    }
    await commit;
    const next = await takeover;
    assert.ok(next.generation > first.generation);
    assert.equal(
      (await model.findOne({ "headers.id": "counter" })).body.count,
      1
    );
    await controller.release(next);
  });

  it("rejects legacy writers after persistent activation, even after config rollback", async () => {
    await seed("counter");
    await assert.rejects(
      persistence.writeFn({ query: {}, data: { "body.count": 5 } }),
      { statusCode: 409 }
    );
    await assert.rejects(persistence.removeFn({}), { statusCode: 409 });
    const restarted = await createProtocol({ store: model, enabled: false });
    await assert.rejects(
      restarted.legacy(async () => {}),
      { statusCode: 409 }
    );
    assert.equal(await model.countDocuments({}), 1);
  });

  it("rejects oversized batches before any view mutation", async () => {
    await seed("counter");
    const lease = await protocol.begin({ playId: "oversized" });
    await assert.rejects(
      protocol.commit({
        ...lease,
        operations: Array.from({ length: 101 }, () =>
          put("counter", { $inc: { count: 1 } })
        ),
      }),
      { statusCode: 400 }
    );
    await assert.rejects(
      protocol.commit({
        ...lease,
        operations: [put("counter", { name: "x".repeat(65536) })],
      }),
      { statusCode: 400 }
    );
    assert.equal(
      (await model.findOne({ "headers.id": "counter" })).body.count,
      0
    );
    await protocol.release(lease);
  });

  it("evaluates query operations in order against earlier writes in the same transaction", async () => {
    await seed("counter");
    const lease = await protocol.begin({ playId: "ordered-queries" });
    await protocol.commit({
      ...lease,
      operations: [
        put("counter", { count: 1 }),
        {
          ...put(undefined, { $inc: { count: 1 } }),
          type: "put-query",
          query: { count: 1 },
        },
        { type: "delete-query", query: { count: 0 }, context },
      ],
    });
    assert.equal(
      (await model.findOne({ "headers.id": "counter" })).body.count,
      2
    );
  });

  it("bounds expanded query mutations and rejects missing IDs before a transaction", async () => {
    await seed("counter");
    const lease = await protocol.begin({ playId: "invalid-intent" });
    await assert.rejects(
      protocol.commit({ ...lease, operations: [put(undefined, { count: 3 })] }),
      { statusCode: 400 }
    );
    await assert.rejects(
      protocol.commit({
        ...lease,
        operations: [
          put("counter", { count: 3 }),
          { type: "delete-query", query: {}, context },
        ],
      }),
      { statusCode: 400 }
    );
    assert.equal(
      (await model.findOne({ "headers.id": "counter" })).body.count,
      0
    );
    await protocol.release(lease);
    await model.insertMany(
      Array.from({ length: 101 }, (_, i) => ({
        headers: {
          id: `many-${i}`,
          context: { ...context.tenant, domain: "tenant" },
        },
        body: { email: `many-${i}@example.invalid`, count: 0 },
      }))
    );
    const batch = await protocol.begin({ playId: "many-query" });
    await assert.rejects(
      protocol.commit({
        ...batch,
        operations: [{ type: "delete-query", query: { count: 0 }, context }],
      }),
      { statusCode: 400 }
    );
    assert.equal(await model.countDocuments({}), 102);
    await protocol.release(batch);
  });

  it("atomically rejects a prepared legacy writer racing activation", async () => {
    await seed("counter");
    await connection.db
      .collection("projection_control")
      .updateOne(
        { _id: "destination" },
        { $set: { enabled: false, prepared: true } }
      );
    const prepared = await createProtocol({ store: model, prepared: true });
    const startSession = connection.startSession.bind(connection);
    let entered, release;
    const reached = new Promise((resolve) => {
      entered = resolve;
    });
    const gate = new Promise((resolve) => {
      release = resolve;
    });
    connection.startSession = async () => {
      entered();
      await gate;
      return startSession();
    };
    let legacy;
    try {
      legacy = prepared.legacy((session) =>
        model.updateOne(
          { "headers.id": "counter" },
          { $set: { "body.count": 99 } },
          { session }
        )
      );
      await reached;
      await createProtocol({ store: model, enabled: true });
      release();
      await assert.rejects(legacy, { statusCode: 409 });
      assert.equal(
        (await model.findOne({ "headers.id": "counter" })).body.count,
        0
      );
    } finally {
      release();
      connection.startSession = startSession;
    }
  });

  it("does not repeat persistence or historical notifications after a push failure", async () => {
    await seed("counter");
    let transforms = 0,
      pushes = 0;
    const execute = createSession({
      request,
      pushFn: async () => {
        pushes++;
        throw new Error("Notification failed");
      },
    });
    const run = async (session) => {
      transforms++;
      session.add(put("counter", { $inc: { count: 1 } }, { push: true }));
    };
    await assert.rejects(
      execute({ playId: "push-failure", run }),
      /Notification failed/
    );
    await execute({ playId: "push-failure", run });
    assert.equal(transforms, 1);
    assert.equal(pushes, 1);
    assert.equal(
      (await model.findOne({ "headers.id": "counter" })).body.count,
      1
    );
  });

  it("does not expose an old notification body or groups after a newer commit", async () => {
    await seed("card");
    const first = await protocol.begin({ playId: "old-notice" });
    const receipt = await protocol.commit({
      ...first,
      operations: [put("card", { count: 1 }, { push: true })],
    });
    const second = await protocol.begin({ playId: "new-state" });
    await protocol.commit({
      ...second,
      operations: [put("card", { count: 2 })],
    });
    assert.deepEqual(
      await protocol.notification({
        generation: receipt.generation,
        id: "card",
      }),
      {}
    );
    assert.deepEqual(
      (await protocol.begin({ playId: "old-notice" })).results,
      []
    );
  });

  it("enforces the configured unique index and does not upsert unmatched positional writes", async () => {
    await seed("one", { email: "same@example.invalid" });
    await assert.rejects(seed("two", { email: "same@example.invalid" }), {
      code: 11000,
    });
    const lease = await protocol.begin({ playId: "positional" });
    await protocol.commit({
      ...lease,
      operations: [put("missing", { $set: { "items.$.name": "updated" } })],
    });
    assert.equal(await model.countDocuments({ "headers.id": "missing" }), 0);
  });
});
