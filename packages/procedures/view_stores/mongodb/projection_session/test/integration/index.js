import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { load } from "../../../../../../cli/blossm/test/load.js";
import composeUpdate from "../../../../../../lib/compose_update/index.js";
import databaseDeps from "@blossm/mongodb-database/deps.js";
import deps from "../../../deps.js";
import adapter, { __resetStoresForTest } from "../../../index.js";
import createProtocol from "../../index.js";
import play from "../../../../../projection/play/index.js";
import createSession from "../../../../../../cli/blossm/src/projection/deploy/src/session.js";

const suite = process.env.BLOSSM_TEST_MONGODB_URI ? describe : describe.skip;
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
    assert.equal(
      new URL(process.env.BLOSSM_TEST_MONGODB_URI).hostname,
      "127.0.0.1",
    );
    process.env.CONTEXT = "tenant";
    connection = await databaseDeps.mongoose
      .createConnection(process.env.BLOSSM_TEST_MONGODB_URI, {
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
      schema: {
        email: String,
        name: String,
        count: Number,
        enabled: Boolean,
        items: [{ id: String, name: String }],
      },
      indexes: [
        [{ name: "text" }, { name: "projection-search", weights: { name: 3 } }],
        [
          { email: 1 },
          { unique: true, partialFilterExpression: { "body.enabled": true } },
        ],
      ],
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
        { $set: { owner: null, expiresAt: new Date(0) } },
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

  it("retains exactly one schema-owned unique view ID index", async () => {
    const indexes = await model.collection.indexes();
    const idIndexes = indexes.filter((index) => index.key["headers.id"] === 1);
    assert.equal(idIndexes.length, 1);
    assert.equal(idIndexes[0].unique, true);
    await seed("unique-id");
    await assert.rejects(seed("unique-id"), { code: 11000 });
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
              hash: "live-event-hash",
              root: "source",
              domain: "test",
              service: "test",
              action: "updated",
            }),
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
      "busy play must not read its triggering or related source",
    );
    release();
    await first;
    facts = 2;
    await handler(liveRequest, res);
    assert.equal(reads, 4);
    assert.equal((await model.findOne({ "headers.id": "card" })).body.count, 2);
  });

  it("applies a republished event once despite distinct Pub/Sub message IDs", async () => {
    await seed("republished-counter");
    let transforms = 0;
    const handler = play({
      sessionFn: sessionFn(),
      aggregateFn: async () => ({}),
      mainFn: async ({ session }) => {
        transforms++;
        session.add(put("republished-counter", { $inc: { count: 1 } }));
      },
    });
    const deliver = (
      hash,
      messageId,
      subscription = "projection-subscription",
    ) =>
      handler(
        {
          body: {
            subscription,
            message: {
              messageId,
              data: Buffer.from(
                JSON.stringify({
                  hash,
                  root: "source",
                  domain: "test",
                  service: "test",
                  network: "test",
                }),
              ).toString("base64"),
            },
          },
        },
        { sendStatus: () => {} },
      );
    await deliver("event-hash", "first-publish");
    await deliver("event-hash", "ack-loss-republish");
    assert.equal(transforms, 1);
    assert.equal(
      (await model.findOne({ "headers.id": "republished-counter" })).body.count,
      1,
    );
    assert.equal(
      await connection.db.collection("projection_receipts").countDocuments({}),
      1,
    );
    await deliver("different-event-hash", "new-event");
    await deliver("event-hash", "other-projection", "other-subscription");
    assert.equal(transforms, 3);
    assert.equal(
      (await model.findOne({ "headers.id": "republished-counter" })).body.count,
      3,
    );
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
      /lost/,
    );
    await sessionFn(transport)({ playId: "stable-increment", run });
    assert.equal(transforms, 1);
    assert.equal(
      (await model.findOne({ "headers.id": "counter" })).body.count,
      1,
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
      }),
    );
    assert.equal(
      (await model.findOne({ "headers.id": "counter" })).body.count,
      0,
    );
    assert.ok(await model.findOne({ "headers.id": "delete-me" }));
    assert.equal(
      await connection.db.collection("projection_receipts").countDocuments({}),
      0,
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
      { statusCode: 409 },
    );
    assert.equal(
      (await model.findOne({ "headers.id": "counter" })).body.count,
      2,
    );
    assert.deepEqual(
      (await model.findOne({ "headers.id": "counter" })).headers.groups,
      [],
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
    // Advance the frozen clock so renewal extends expiry rather than issuing a no-op.
    clock = new Date(clock.getTime() + 1);
    let renewalSettled = false;
    const renewal = controller.renew(first).then(
      () => {
        renewalSettled = true;
        return null;
      },
      (error) => {
        renewalSettled = true;
        return error;
      },
    );
    clock = new Date(clock.getTime() + first.limits.leaseMilliseconds + 1);
    let acquired = false;
    const takeover = controller.begin({ playId: "takeover" }).then((lease) => {
      acquired = true;
      return lease;
    });
    try {
      await new Promise((resolve) => setTimeout(resolve, 30));
      assert.equal(acquired, false);
      assert.equal(
        renewalSettled,
        false,
        "renewal must also wait behind the transactional fence",
      );
    } finally {
      release();
    }
    await commit;
    assert.equal((await renewal).statusCode, 409);
    const next = await takeover;
    assert.ok(next.generation > first.generation);
    assert.equal(
      (await model.findOne({ "headers.id": "counter" })).body.count,
      1,
    );
    await controller.release(next);
  });

  it("keeps direct remote writes independent of a projection lease", async () => {
    await seed("direct");
    const lease = await protocol.begin({ playId: "cooperating" });
    await persistence.writeFn({
      query: { "headers.id": "direct" },
      data: { "body.count": 7 },
    });
    assert.equal(
      (await model.findOne({ "headers.id": "direct" })).body.count,
      7,
    );
    assert.equal(
      await connection.db.collection("projection_receipts").countDocuments({}),
      0,
    );
    await protocol.release(lease);
  });

  it("rejects oversized batches before any view mutation", async () => {
    await seed("counter");
    const lease = await protocol.begin({ playId: "oversized" });
    await assert.rejects(
      protocol.commit({
        ...lease,
        operations: Array.from({ length: 101 }, () =>
          put("counter", { $inc: { count: 1 } }),
        ),
      }),
      { statusCode: 400 },
    );
    await assert.rejects(
      protocol.commit({
        ...lease,
        operations: [put("counter", { name: "x".repeat(65536) })],
      }),
      { statusCode: 400 },
    );
    assert.equal(
      (await model.findOne({ "headers.id": "counter" })).body.count,
      0,
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
      2,
    );
  });

  it("bounds expanded query mutations and rejects missing IDs before a transaction", async () => {
    await seed("counter");
    const lease = await protocol.begin({ playId: "invalid-intent" });
    await assert.rejects(
      protocol.commit({ ...lease, operations: [put(undefined, { count: 3 })] }),
      { statusCode: 400 },
    );
    await assert.rejects(
      protocol.commit({
        ...lease,
        operations: [
          put("counter", { count: 3 }),
          { type: "delete-query", query: {}, context },
        ],
      }),
      { statusCode: 400 },
    );
    assert.equal(
      (await model.findOne({ "headers.id": "counter" })).body.count,
      0,
    );
    await protocol.release(lease);
    await model.insertMany(
      Array.from({ length: 101 }, (_, i) => ({
        headers: {
          id: `many-${i}`,
          context: { ...context.tenant, domain: "tenant" },
        },
        body: { email: `many-${i}@example.invalid`, count: 0 },
      })),
    );
    const batch = await protocol.begin({ playId: "many-query" });
    await assert.rejects(
      protocol.commit({
        ...batch,
        operations: [{ type: "delete-query", query: { count: 0 }, context }],
      }),
      { statusCode: 400 },
    );
    assert.equal(await model.countDocuments({}), 102);
    await protocol.release(batch);
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
    await execute({ playId: "push-failure", run });
    await execute({ playId: "push-failure", run });
    assert.equal(transforms, 1);
    assert.equal(pushes, 1);
    assert.equal(
      (await model.findOne({ "headers.id": "counter" })).body.count,
      1,
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
      {},
    );
    assert.deepEqual(
      (await protocol.begin({ playId: "old-notice" })).results,
      [],
    );
  });

  it("does not upsert unmatched positional writes", async () => {
    const lease = await protocol.begin({ playId: "positional" });
    await protocol.commit({
      ...lease,
      operations: [put("missing", { $set: { "items.$.name": "updated" } })],
    });
    assert.equal(await model.countDocuments({ "headers.id": "missing" }), 0);
  });

  it("prevents the stale overwrite reproduced by an unfenced read/transform/write", async () => {
    await seed("stale");
    let source = 1;
    let release, entered;
    const gate = new Promise((resolve) => {
      release = resolve;
    });
    const started = new Promise((resolve) => {
      entered = resolve;
    });
    const read = async () => ({ state: source });
    const oldHandler = play({
      aggregateFn: read,
      mainFn: async ({ aggregate }) => {
        if (aggregate.state === 1) {
          entered();
          await gate;
        }
        await persistence.writeFn({
          query: { "headers.id": "stale" },
          data: { "body.count": aggregate.state },
        });
      },
    });
    const req = { body: { root: "source" } };
    const res = { sendStatus() {} };
    const old = oldHandler(req, res);
    await started;
    try {
      source = 2;
      await oldHandler(req, res);
      assert.equal(
        (await model.findOne({ "headers.id": "stale" })).body.count,
        2,
      );
    } finally {
      release();
      await old;
    }
    assert.equal(
      (await model.findOne({ "headers.id": "stale" })).body.count,
      1,
      "baseline race must be reproduced",
    );

    source = 1;
    let releaseFenced, enteredFenced;
    const fencedGate = new Promise((resolve) => {
      releaseFenced = resolve;
    });
    const fencedStarted = new Promise((resolve) => {
      enteredFenced = resolve;
    });
    const handler = play({
      sessionFn: sessionFn(),
      aggregateFn: read,
      mainFn: async ({ aggregate, session }) => {
        if (aggregate.state === 1) {
          enteredFenced();
          await fencedGate;
        }
        session.add(put("stale", { count: aggregate.state }));
      },
    });
    const requestFor = (playId) => ({ body: { root: "source", playId } });
    const first = handler(requestFor("older-fenced"), res);
    await fencedStarted;
    try {
      source = 2;
      await assert.rejects(handler(requestFor("newer-fenced"), res), {
        statusCode: 409,
      });
    } finally {
      releaseFenced();
      await first;
    }
    await handler(requestFor("newer-fenced"), res);
    assert.equal(
      (await model.findOne({ "headers.id": "stale" })).body.count,
      2,
    );
  });

  it("recovers a crashed precommit play after expiry without accepting its stale owner", async () => {
    await seed("crash");
    const abandoned = await protocol.begin({ playId: "crashed-before-commit" });
    assert.equal(
      await connection.db.collection("projection_receipts").countDocuments({}),
      0,
    );
    assert.equal(
      (await model.findOne({ "headers.id": "crash" })).body.count,
      0,
    );
    await connection.db
      .collection("projection_control")
      .updateOne({ _id: "destination" }, { $set: { expiresAt: new Date(0) } });
    const replacement = await protocol.begin({ playId: abandoned.playId });
    assert.ok(replacement.generation > abandoned.generation);
    await protocol.release(abandoned);
    await protocol.renew(replacement);
    await assert.rejects(
      protocol.commit({
        ...abandoned,
        operations: [put("crash", { $inc: { count: 1 } })],
      }),
      { statusCode: 409 },
    );
    await protocol.commit({
      ...replacement,
      operations: [put("crash", { $inc: { count: 1 } })],
    });
    assert.deepEqual(await protocol.begin({ playId: abandoned.playId }), {
      complete: true,
      results: [],
    });
    assert.equal(
      (await model.findOne({ "headers.id": "crash" })).body.count,
      1,
    );
    assert.equal(
      await connection.db.collection("projection_receipts").countDocuments({}),
      1,
    );
  });

  it("renews an active lease and rejects renewal after its renewed expiry", async () => {
    let clock = new Date();
    const controller = await createProtocol({ store: model, now: () => clock });
    const first = await controller.begin({ playId: "renewed" });
    clock = new Date(clock.getTime() + first.limits.leaseMilliseconds / 2);
    await controller.renew(first);
    clock = new Date(clock.getTime() + first.limits.leaseMilliseconds / 2 + 1);
    await assert.rejects(controller.begin({ playId: "too-early" }), {
      statusCode: 409,
    });
    clock = new Date(clock.getTime() + first.limits.leaseMilliseconds);
    await assert.rejects(controller.renew(first), { statusCode: 409 });
    const next = await controller.begin({ playId: "after-renewed-expiry" });
    assert.ok(next.generation > first.generation);
    await controller.release(next);
  });

  it("preserves generated raw guards, separate array filters and no-push no-op semantics", async () => {
    await seed("guarded", {
      count: 2,
      items: [
        { id: "first", name: "old" },
        { id: "second", name: "old" },
      ],
    });
    let pushes = 0;
    const execute = createSession({
      request,
      pushFn: async () => {
        pushes++;
      },
    });
    const run = async (playId, operation) => {
      const adapter = await load("blossm/src/projection/deploy/src/index.js", {
        projection: (options) => options,
        projectionSession: () => () => {},
        config: { name: "cards" },
        process: { env: { CONTEXT: "tenant" } },
        handlers: {
          test: {
            source: async () => ({ ...operation, context: context.tenant }),
          },
        },
        gcpSecret: {},
        composeUpdate,
      });
      await execute({
        playId,
        run: (session) =>
          adapter.mainFn({
            aggregate: {
              headers: { service: "test", domain: "source", root: "source" },
            },
            push: true,
            session,
          }),
      });
    };
    await run("failed-existing-guard", {
      id: "guarded",
      query: { count: 1 },
      update: { count: 3 },
    });
    await run("failed-missing-guard", {
      id: "missing",
      query: { count: 1 },
      update: { count: 3 },
    });
    assert.equal(
      (await model.findOne({ "headers.id": "guarded" })).body.count,
      2,
    );
    assert.equal(await model.countDocuments({ "headers.id": "missing" }), 0);
    assert.equal(pushes, 0);
    await run("named-filter", {
      id: "guarded",
      query: { count: 2 },
      update: { $set: { "items.$[item].name": "new" } },
      arrayFilters: [{ "item.id": "first" }],
    });
    assert.deepEqual(
      (await model.findOne({ "headers.id": "guarded" })).body.items.map(
        (item) => item.name,
      ),
      ["new", "old"],
    );
    assert.equal(pushes, 1);
    await run("failed-delete-guard", {
      id: "guarded",
      query: { count: 1 },
      del: true,
    });
    assert.equal(await model.countDocuments({ "headers.id": "guarded" }), 1);
    await run("matching-delete-guard", {
      id: "guarded",
      query: { count: 2 },
      del: true,
    });
    assert.equal(await model.countDocuments({ "headers.id": "guarded" }), 0);
  });

  it("retains native configured index constraints for fenced writes and rolls back duplicates", async () => {
    const indexes = await model.collection.indexes();
    const email = indexes.find((index) => index.key["body.email"] === 1);
    assert.equal(email.unique, true);
    assert.deepEqual(email.partialFilterExpression, { "body.enabled": true });
    const text = indexes.find((index) => index.name === "projection-search");
    assert.equal(text.weights["body.name"], 3);
    const lease = await protocol.begin({ playId: "duplicate-index" });
    await assert.rejects(
      protocol.commit({
        ...lease,
        operations: [
          put("one", { email: "same@example.invalid", enabled: true }),
          put("two", { email: "same@example.invalid", enabled: true }),
        ],
      }),
      { code: 11000 },
    );
    assert.equal(await model.countDocuments({}), 0);
    assert.equal(
      await connection.db.collection("projection_receipts").countDocuments({}),
      0,
    );
    await protocol.release(lease);
  });
  it("rolls mutations back when formatted notification output exceeds its bound", async () => {
    await seed("large-notification", { name: "x".repeat(1048576) });
    const lease = await protocol.begin({ playId: "oversized-notification" });
    await assert.rejects(
      protocol.commit({
        ...lease,
        operations: [
          put("large-notification", { $inc: { count: 1 } }, { push: true }),
        ],
      }),
      { statusCode: 400 },
    );
    assert.equal(
      (await model.findOne({ "headers.id": "large-notification" })).body.count,
      0,
    );
    assert.equal(
      await connection.db.collection("projection_receipts").countDocuments({}),
      0,
    );
    await protocol.release(lease);
  });
});
