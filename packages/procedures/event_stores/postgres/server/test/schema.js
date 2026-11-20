import { expect } from "chai";
import { fake, replace, restore } from "sinon";
import hash from "@blossm/hash";
import postTransaction from "@blossm/event-store-post-transaction";

import eventStore from "../index.js";
import deps from "../deps.js";

const failure = async (fn) => {
  try {
    await fn();
  } catch (err) {
    return err;
  }
  throw new Error("Expected the operation to fail.");
};

// The real generic append transaction and PostgreSQL operations, composed by
// the real server. Only the pool, table preparation and HTTP server are replaced;
// the transaction is a recording client that sees the actual SQL parameters.
describe("Postgres event store declared schema", () => {
  const database = { end: fake.resolves() };
  const table = (kind) => ({ database, kind, table: `"test"."${kind}"` });
  let api;
  let transaction;

  beforeEach(async () => {
    replace(deps, "db", { connect: () => database });
    replace(
      deps,
      "stores",
      fake.resolves({
        eventStore: table("events"),
        snapshotStore: table("snapshots"),
        countsStore: table("counts"),
        blockchainStore: table("blockchain"),
        publicationsStore: table("publications"),
      }),
    );
    replace(deps, "eventStore", async (options) => {
      api = options;
    });
    transaction = {
      query: fake(async (text, values) => ({
        rows: text.includes('"counts"')
          ? [{ root: values[0], value: String(values[1]) }]
          : text.includes('"snapshots"')
            ? [{ doc: JSON.parse(values.at(-2)), events: values.at(-1) }]
            : [],
      })),
    };
    await eventStore({
      schema: {
        amount: { type: "Number", required: true },
        label: "String",
        when: "Date",
      },
      handlers: { add: () => ({}) },
      publishFn: async () => {},
    });
  });
  afterEach(restore);

  const event = (payload) => ({
    event: {
      headers: {
        root: "root",
        action: "add",
        domain: process.env.DOMAIN,
        service: process.env.SERVICE,
        network: process.env.NETWORK,
        topic: "added",
        version: 0,
        created: "2026-01-01T00:00:00.000Z",
        idempotency: "id",
      },
      payload,
    },
  });
  const inserted = (kind) =>
    transaction.query
      .getCalls()
      .map(({ args: [text, values] }) => ({ text, values }))
      .filter(({ text }) => text.startsWith(`INSERT INTO "test"."${kind}"`));

  it("casts before hashing and inserts exactly the hashed payload and transaction", async () => {
    const submitted = {
      amount: "2",
      label: 7,
      when: "2026-01-01",
      undeclared: true,
    };
    await postTransaction({
      ...api,
      eventData: [event(submitted)],
      tx: { id: 123, claims: { exp: "2026-01-01T00:00:00Z" } },
    })(transaction);

    const [insert] = inserted("events");
    // Columns are hash, nonce, root, number, created, idempotency, doc.
    const stored = JSON.parse(insert.values[6]);
    expect(stored.payload).to.deep.equal({
      amount: 2,
      label: "7",
      when: "2026-01-01T00:00:00.000Z",
    });
    expect(stored.tx).to.deep.equal({
      id: "123",
      claims: { exp: "2026-01-01T00:00:00.000Z" },
      path: [],
    });
    expect(stored.headers.pHash).to.equal(hash(stored.payload).create());
    expect(stored.headers.pHash).not.to.equal(hash(submitted).create());
    expect(stored.headers.tHash).to.equal(hash(stored.tx).create());
    expect(stored.hash).to.equal(hash(stored.headers).create());
    expect(insert.values[0]).to.equal(stored.hash);

    // The outbox notice in the same transaction names the same committed hash.
    const [notice] = inserted("publications");
    expect(JSON.parse(notice.values.at(-1)).hash).to.equal(stored.hash);
    expect(JSON.parse(notice.values.at(-1)).data.hash).to.equal(stored.hash);
  });

  it("rejects an invalid payload before reserving a count or inserting", async () => {
    const error = await failure(() =>
      postTransaction({
        ...api,
        eventData: [event({ amount: "several" })],
        tx: { id: "tx" },
      })("transaction"),
    );
    expect(error.statusCode).to.equal(400);
    expect(error.message).to.equal("Invalid event payload.");
    expect(transaction.query.called).to.equal(false);
  });

  it("normalizes and stores the event in local mode without writing an outbox notice", async () => {
    const nodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "local";
    try {
      // The bypass is chosen at composition, so compose again in local mode.
      await eventStore({
        schema: { amount: "Number" },
        handlers: { add: () => ({}) },
        publishFn: async () => {},
      });
      await postTransaction({
        ...api,
        eventData: [event({ amount: "2", undeclared: true })],
        tx: { id: "tx" },
      })(transaction);
    } finally {
      if (nodeEnv === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = nodeEnv;
    }
    const [insert] = inserted("events");
    const stored = JSON.parse(insert.values[6]);
    expect(stored.payload).to.deep.equal({ amount: 2 });
    expect(stored.headers.pHash).to.equal(hash(stored.payload).create());
    expect(inserted("publications")).to.deep.equal([]);
    expect(api.publishPendingFn).to.equal(undefined);
  });

  it("saves a snapshot unchanged only when its hashed state satisfies the schema", async () => {
    const snapshot = {
      hash: "snapshot",
      headers: {
        nonce: "root_0",
        root: "root",
        number: 0,
        created: "2026-01-01T00:00:00.000Z",
      },
      state: { amount: 2, label: "pink" },
      events: Buffer.from([1]),
    };
    expect(await api.saveSnapshotFn({ snapshot, transaction })).to.deep.equal(
      snapshot,
    );
    const [insert] = inserted("snapshots");
    expect(JSON.parse(insert.values.at(-2)).state).to.deep.equal(
      snapshot.state,
    );

    for (const state of [{ amount: "2" }, { amount: 2, total: 4 }, {}]) {
      const error = await failure(() =>
        api.saveSnapshotFn({ snapshot: { ...snapshot, state }, transaction }),
      );
      expect(error.statusCode).to.equal(400);
    }
    expect(inserted("snapshots")).to.have.length(1);
  });
});
