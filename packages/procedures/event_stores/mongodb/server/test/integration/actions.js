import { expect } from "chai";
import { rejects } from "node:assert/strict";
import { replace, fake } from "sinon";
import setup from "./setup.js";
import { setTimeout, clearTimeout } from "node:timers";
import mongoose from "mongoose";
import createEvent from "../../../../../../lib/create_event/index.js";
import hash from "../../../../../../lib/hash/index.js";
import { COMMITTED, DUPLICATE } from "@blossm/event-outcome-consts";
import { QUEUED } from "@blossm/rpc-delivery-consts";
import eventStoreServer from "../../../../generic/server/index.js";
import genericDeps from "../../../../generic/server/deps.js";
import postTransaction from "../../../../generic/post_transaction/index.js";
import server from "../../index.js";
import serverDeps from "../../deps.js";
import actionDeps from "../../../deliver_actions/deps.js";

describe("MongoDB durable actions", function () {
  this.timeout(30000);
  setup();
  let composition,
    receipts,
    effects,
    receiver,
    events,
    actions,
    publications,
    counts,
    actionQuery,
    event,
    append,
    handler,
    blockHandler,
    submit,
    block,
    assertMissing;
  let prepareFailure, failPublication, queueOnly, mismatchAck;
  let prepared, concurrentGate, concurrentId;
  const seen = [];
  const originalDb = actionDeps.db;
  const restoreRemove = originalDb.remove;

  before(async () => {
    // The receiver atomically records the action ID and its business effect. Its
    // response is an acknowledgment of commitment, not HTTP or queue acceptance.
    receipts = mongoose.model(
      "action_receipts",
      new mongoose.Schema(
        {
          id: { type: String, unique: true, required: true },
          intentHash: { type: String, required: true },
        },
        { versionKey: false }
      )
    );
    effects = mongoose.model(
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
    receiver = async (record) => {
      expect(hash(record.intent).create()).to.equal(record.intentHash);
      const intent = JSON.parse(record.intent);
      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          const existing = await receipts
            .findOne({ id: record.id })
            .session(session)
            .lean();
          if (existing) {
            expect(
              existing.intentHash,
              "action ID reused with different intent"
            ).to.equal(record.intentHash);
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
        expect(existing).to.exist;
        expect(
          existing.intentHash,
          "action ID reused with different intent"
        ).to.equal(record.intentHash);
      } finally {
        await session.endSession();
      }
      return { id: record.id, intentHash: record.intentHash };
    };
    replace(genericDeps, "logger", { error: fake() });
    replace(genericDeps, "server", () => ({
      get() {
        return this;
      },
      post(fn, options) {
        if (options?.path === "/create-block") blockHandler = fn;
        else handler = fn;
        return this;
      },
      listen() {},
    }));
    replace(serverDeps, "eventStore", (options) => {
      composition = options;
      return eventStoreServer(options);
    });
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
        seen.push(record);
        if (queueOnly) return { delivery: QUEUED };
        if (mismatchAck) return { id: record.id, intentHash: "different-hash" };
        if (concurrentGate && record.id === concurrentId)
          await concurrentGate();
        return receiver(record);
      },
    });
    expect(typeof composition.publishPendingFn).to.equal("function");
    events = mongoose.model("events");
    actions = mongoose.model("actions");
    publications = mongoose.model("publications");
    counts = mongoose.model("counts");
    await Promise.all(
      mongoose.modelNames().map((name) => mongoose.model(name).init())
    );
    actionQuery = (target) => ({
      intent: JSON.stringify({ target, amount: 1 }),
    });
    event = (root) =>
      createEvent({
        root,
        action: "set",
        domain: "test",
        service: "events",
        network: "local",
        version: 1,
        idempotency: root,
        payload: { amount: 1 },
      });
    append = (root, transaction) =>
      postTransaction({
        eventData: [{ event: event(root) }],
        tx: { id: root },
        saveEventsFn: composition.saveEventsFn,
        reserveRootCountsFn: composition.reserveRootCountsFn,
      })(transaction);
    submit = async (root) => {
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
    block = () => blockHandler({}, { send() {} });
    assertMissing = async (root) => {
      expect(await events.countDocuments({ "headers.root": root })).to.equal(0);
      expect(await actions.countDocuments(actionQuery(root))).to.equal(0);
      expect(await counts.countDocuments({ root })).to.equal(0);
      expect(await publications.countDocuments({ "data.root": root })).to.equal(
        0
      );
    };
  });

  beforeEach(async () => {
    prepareFailure = failPublication = queueOnly = mismatchAck = false;
    prepared = 0;
    concurrentGate = concurrentId = undefined;
    seen.length = 0;
    genericDeps.logger.error.resetHistory();
    await Promise.all(
      mongoose.modelNames().map((name) => mongoose.model(name).deleteMany({}))
    );
  });

  afterEach(() => {
    originalDb.remove = restoreRemove;
  });

  it("producer transaction abort leaves neither events, counts, notices nor action intents", async () => {
    await rejects(
      composition.createTransactionFn(async (transaction) => {
        await append("abort", transaction);
        throw new Error("abort before commit");
      }),
      /abort before commit/
    );
    await assertMissing("abort");
  });

  it("trusted action preparation failure rolls back the event and all pending work", async () => {
    prepareFailure = true;
    await rejects(submit("prepare-failure"), /action preparation unavailable/);
    prepareFailure = false;
    await assertMissing("prepare-failure");
  });

  it("duplicate producer submission creates no new intent; receiver rejects changed intent under the same ID", async () => {
    expect(await submit("duplicate")).to.deep.equal({ outcomes: [COMMITTED] });
    const before = prepared;
    expect(await submit("duplicate")).to.deep.equal({ outcomes: [DUPLICATE] });
    expect(prepared).to.equal(before);
    expect(await effects.countDocuments({ target: "duplicate" })).to.equal(1);
    expect(await actions.countDocuments()).to.equal(0);
    const record = seen.find(
      (entry) =>
        entry.intent === JSON.stringify({ target: "duplicate", amount: 1 })
    );
    expect(record.id).to.equal(`${record.eventHash}:0`);
    await rejects(
      receiver({
        ...record,
        intent: JSON.stringify({ target: "changed", amount: 2 }),
        intentHash: hash(
          JSON.stringify({ target: "changed", amount: 2 })
        ).create(),
      }),
      /different intent/
    );
    expect(await effects.countDocuments({ target: "changed" })).to.equal(0);
  });

  it("scheduled block recovery completes action committed before its dispatcher ran", async () => {
    await composition.createTransactionFn((transaction) =>
      append("crash", transaction)
    );
    expect(await actions.countDocuments(actionQuery("crash"))).to.equal(1);
    expect(await effects.countDocuments({ target: "crash" })).to.equal(0);
    await block();
    expect(await effects.countDocuments({ target: "crash" })).to.equal(1);
    expect(await actions.countDocuments(actionQuery("crash"))).to.equal(0);
  });

  it("receiver success before pending deletion retries safely with one business effect", async () => {
    await composition.createTransactionFn((transaction) =>
      append("ack-before-delete", transaction)
    );
    const originalRemove = originalDb.remove;
    originalDb.remove = async (args) => {
      if (args.store.modelName === "actions")
        throw new Error("action deletion unavailable");
      return originalRemove(args);
    };
    await rejects(
      composition.publishPendingFn(),
      /action deletion unavailable/
    );
    expect(
      await actions.countDocuments(actionQuery("ack-before-delete"))
    ).to.equal(1);
    expect(
      await effects.countDocuments({ target: "ack-before-delete" })
    ).to.equal(1);
    originalDb.remove = originalRemove;
    await block();
    expect(
      await effects.countDocuments({ target: "ack-before-delete" })
    ).to.equal(1);
    expect(
      await actions.countDocuments(actionQuery("ack-before-delete"))
    ).to.equal(0);
  });

  it("overlapping drainers redeliver the same action while receiver commits one business effect", async () => {
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
    expect(arrivals).to.equal(2);
    expect(await effects.countDocuments({ target: "concurrent" })).to.equal(1);
    expect(await actions.countDocuments(actionQuery("concurrent"))).to.equal(0);
  });

  it("queue-only or mismatched acknowledgement retains the action until durable matching acknowledgement", async () => {
    await composition.createTransactionFn((transaction) =>
      append("ack-contract", transaction)
    );
    queueOnly = true;
    await rejects(composition.publishPendingFn());
    queueOnly = false;
    expect(await actions.countDocuments(actionQuery("ack-contract"))).to.equal(
      1
    );
    expect(await effects.countDocuments({ target: "ack-contract" })).to.equal(
      0
    );
    mismatchAck = true;
    await rejects(composition.publishPendingFn());
    mismatchAck = false;
    expect(await actions.countDocuments(actionQuery("ack-contract"))).to.equal(
      1
    );
    await composition.publishPendingFn();
    expect(await effects.countDocuments({ target: "ack-contract" })).to.equal(
      1
    );
  });

  it("notification failure does not starve durable actions and its notice later recovers", async () => {
    failPublication = true;
    expect(await submit("independent")).to.deep.equal({
      outcomes: [COMMITTED],
    });
    expect(genericDeps.logger.error.callCount).to.equal(1);
    expect(await effects.countDocuments({ target: "independent" })).to.equal(1);
    expect(await actions.countDocuments(actionQuery("independent"))).to.equal(
      0
    );
    expect(
      await publications.countDocuments({ "data.root": "independent" })
    ).to.equal(1);
    failPublication = false;
    await composition.publishPendingFn();
    expect(await publications.countDocuments()).to.equal(0);
  });
});
