import { expect } from "chai";
import { rejects } from "node:assert/strict";
import { replace, fake } from "sinon";
import { COMMITTED, DUPLICATE } from "@blossm/event-outcome-consts";
import setup from "./setup.js";
import mongoose from "mongoose";
import createEvent from "../../../../../../lib/create_event/index.js";
import eventStoreServer from "../../../../generic/server/index.js";
import genericDeps from "../../../../generic/server/deps.js";
import postTransaction from "../../../../generic/post_transaction/index.js";
import server from "../../index.js";
import serverDeps from "../../deps.js";
import publicationsDeps from "../../../publish_pending/deps.js";

describe("MongoDB publication recovery", function () {
  this.timeout(30000);
  setup();
  let composition,
    eventStore,
    publicationsStore,
    countsStore,
    event,
    append,
    handler,
    block,
    blockHandler,
    serverOptions,
    start;
  let delivered, failPublish, failRoot;
  const deliveredHashes = [];

  before(async () => {
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
    serverOptions = {
      schema: { amount: Number },
      publicationBatchSize: 2,
      handlers: { set: (state, payload) => ({ ...state, ...payload }) },
      secretFn: async () => undefined,
      publishFn: async (data) => {
        if (failPublish || data.root === failRoot)
          throw new Error("pubsub unavailable");
        delivered++;
        deliveredHashes.push(data.hash);
      },
      signFn: async () => "signature",
      blockPublisherPublicKeyFn: async () => "public-key",
      isPublic: true,
    };
    await server(serverOptions);
    await Promise.all(
      mongoose.modelNames().map((name) => mongoose.model(name).init())
    );
    eventStore = mongoose.model("events");
    publicationsStore = mongoose.model("publications");
    countsStore = mongoose.model("counts");
    event = (id) =>
      createEvent({
        root: id,
        action: "set",
        domain: "test",
        service: "events",
        network: "local",
        version: 1,
        idempotency: id,
        payload: { amount: 1 },
      });

    append = (id, transaction) =>
      postTransaction({
        normalizeTransactionFn: composition.normalizeTransactionFn,
        eventData: [{ event: event(id) }],
        saveEventsFn: composition.saveEventsFn,
        reserveRootCountsFn: composition.reserveRootCountsFn,
        tx: { id },
      })(transaction);
    start = async () => {
      const createServer = genericDeps.server;
      const compose = serverDeps.eventStore;
      let listening = false;
      genericDeps.server = () => ({
        get() {
          return this;
        },
        post() {
          return this;
        },
        listen() {
          listening = true;
        },
      });
      serverDeps.eventStore = eventStoreServer;
      try {
        await server(serverOptions);
        return listening;
      } finally {
        genericDeps.server = createServer;
        serverDeps.eventStore = compose;
      }
    };
    block = async () => {
      let result;
      await blockHandler(
        {},
        {
          send(value) {
            result = value;
          },
        }
      );
      return result;
    };
  });

  beforeEach(async () => {
    delivered = 0;
    failPublish = false;
    failRoot = undefined;
    deliveredHashes.length = 0;
    await Promise.all(
      mongoose.modelNames().map((name) => mongoose.model(name).deleteMany({}))
    );
  });

  it("rolls back events, counts and notices together", async () => {
    await rejects(
      composition.createTransactionFn(async (transaction) => {
        await append("aborted", transaction);
        throw new Error("abort transaction");
      }),
      /abort transaction/
    );
    expect(await eventStore.countDocuments()).to.equal(0);
    expect(await publicationsStore.countDocuments()).to.equal(0);
    expect(await countsStore.countDocuments()).to.equal(0);
  });

  it("recovers publication on a duplicate event retry", async () => {
    failPublish = true;
    const request = {
      body: {
        eventData: [{ event: event("retry") }],
        tx: { id: "retry" },
        returnOutcomes: true,
      },
    };
    const send = fake();
    await handler(request, { send });
    expect(send.lastCall.args[0]).to.deep.equal({ outcomes: [COMMITTED] });
    expect(await eventStore.countDocuments()).to.equal(1);
    expect(await publicationsStore.countDocuments()).to.equal(1);
    failPublish = false;
    await handler(request, { send });
    expect(send.lastCall.args[0]).to.deep.equal({ outcomes: [DUPLICATE] });
    expect(await eventStore.countDocuments()).to.equal(1);
    expect(
      await countsStore.findOne({ root: "retry" }).then(({ value }) => value)
    ).to.equal(1);
    expect(await publicationsStore.countDocuments()).to.equal(0);
    expect(delivered).to.equal(1);
  });

  it("recovers a committed notice through scheduled block creation", async () => {
    // A process may stop after append commits but before it calls the dispatcher.
    await composition.createTransactionFn((transaction) =>
      append("crash", transaction)
    );
    expect(await publicationsStore.countDocuments()).to.equal(1);
    const genesis = await block();
    expect(genesis.headers.sCount).to.equal(0);
    expect(await publicationsStore.countDocuments()).to.equal(0);
    expect(delivered).to.equal(1);
  });

  it("rolls back the event and counter when its notice collides", async () => {
    const collisionHash = "outbox-collision";
    await publicationsStore.create({
      hash: collisionHash,
      created: new Date(),
      topic: "events",
      data: { root: "seed" },
    });
    await composition.createTransactionFn((transaction) =>
      append("seed", transaction)
    );
    const cloned = await eventStore.findOne().lean();
    delete cloned._id;
    cloned.hash = collisionHash;
    cloned.headers = {
      ...cloned.headers,
      root: "collision",
      nonce: "collision_0",
      idempotency: "collision",
    };
    await rejects(
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
    expect(
      await eventStore.countDocuments({ "headers.root": "collision" })
    ).to.equal(0);
    expect(await countsStore.countDocuments({ root: "collision" })).to.equal(0);
    expect(
      await publicationsStore.countDocuments({ hash: collisionHash })
    ).to.equal(1);
    await publicationsStore.deleteOne({ hash: collisionHash });
  });

  it("redelivers after publication succeeds but deletion fails", async () => {
    await block();
    await composition.createTransactionFn((transaction) =>
      append("ack-before-delete", transaction)
    );
    const remove = publicationsDeps.db.remove;
    publicationsDeps.db.remove = async () => {
      throw new Error("delete unavailable");
    };
    try {
      const committed = await block();
      expect(committed).to.have.property("headers");
    } finally {
      publicationsDeps.db.remove = remove;
    }
    expect(await publicationsStore.countDocuments()).to.equal(1);
    const empty = await block();
    expect(empty.headers.eCount).to.equal(0);
    expect(empty.headers.sCount).to.equal(0);
    expect(await publicationsStore.countDocuments()).to.equal(0);
    expect(delivered).to.equal(2);
    const { hash } = await eventStore
      .findOne({ "headers.root": "ack-before-delete" })
      .lean();
    expect(deliveredHashes).to.deep.equal([hash, hash]);
  });
  it("drains one configured batch per invocation without skipping pending notices", async () => {
    await composition.createTransactionFn(async (transaction) => {
      for (let index = 0; index < 5; index++)
        await append(`batch-${index}`, transaction);
    });
    expect(await publicationsStore.countDocuments()).to.equal(5);
    await composition.publishPendingFn();
    expect(delivered).to.equal(2);
    expect(await publicationsStore.countDocuments()).to.equal(3);
    await composition.publishPendingFn();
    expect(delivered).to.equal(4);
    expect(await publicationsStore.countDocuments()).to.equal(1);
    await composition.publishPendingFn();
    expect(delivered).to.equal(5);
    expect(await publicationsStore.countDocuments()).to.equal(0);
  });

  it("recovers a bounded batch while a new server starts without receiving requests", async () => {
    await composition.createTransactionFn(async (transaction) => {
      for (let index = 0; index < 3; index++)
        await append(`startup-${index}`, transaction);
    });
    expect(await start()).to.equal(true);
    expect(delivered).to.equal(2);
    expect(await publicationsStore.countDocuments()).to.equal(1);
    expect(await start()).to.equal(true);
    expect(delivered).to.equal(3);
    expect(await publicationsStore.countDocuments()).to.equal(0);
  });

  it("retains notices after startup publication fails and allows the server to listen", async () => {
    await composition.createTransactionFn((transaction) =>
      append("startup-failure", transaction)
    );
    failPublish = true;
    const logger = genericDeps.logger;
    const error = fake();
    genericDeps.logger = { error };
    try {
      expect(await start()).to.equal(true);
      expect(error.callCount).to.equal(1);
      expect(await publicationsStore.countDocuments()).to.equal(1);
      failPublish = false;
      expect(await start()).to.equal(true);
      expect(await publicationsStore.countDocuments()).to.equal(0);
      expect(delivered).to.equal(1);
    } finally {
      genericDeps.logger = logger;
    }
  });

  it("acknowledges a new write even when an older notice fails, then recovers the same notice hash", async () => {
    await composition.createTransactionFn((transaction) =>
      append("old-pending", transaction)
    );
    const oldEvent = await eventStore
      .findOne({ "headers.root": "old-pending" })
      .lean();
    failRoot = "old-pending";
    const sendStatus = fake();
    await handler(
      { body: { eventData: [{ event: event("unrelated") }] } },
      { sendStatus }
    );
    expect(sendStatus.firstCall.args[0]).to.equal(204);
    expect(await eventStore.countDocuments()).to.equal(2);
    expect(await publicationsStore.countDocuments()).to.equal(1);
    const pending = await publicationsStore.findOne().lean();
    expect(pending.hash).to.equal(oldEvent.hash);
    expect(pending.data.hash).to.equal(oldEvent.hash);
    failRoot = undefined;
    await block();
    expect(deliveredHashes).to.include(oldEvent.hash);
    expect(await publicationsStore.countDocuments()).to.equal(0);
  });
});
