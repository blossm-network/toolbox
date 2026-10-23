import { expect } from "chai";
import { fake, replace, restore } from "sinon";

import stores, { find, stream, create, save } from "../index.js";
import deps from "../deps.js";

const database = {};
const eventStore = { database, kind: "events", table: '"public"."events"' };
const snapshotStore = {
  database,
  kind: "snapshots",
  table: '"public"."snapshots"',
};
const headers = {
  nonce: "root_0",
  root: "root",
  number: 0,
  created: "2026-10-22T00:00:00.000Z",
  idempotency: "id",
};
const event = { hash: "hash", headers, payload: { count: 0 } };

describe("Postgres event store storage", () => {
  afterEach(restore);

  it("initializes separate tables under one locked transaction", async () => {
    const transaction = {};
    const query = fake.resolves({ rows: [] });
    const createTransaction = fake(async ({ fn }) => fn(transaction));
    replace(deps, "db", { query, createTransaction });
    const result = await stores({
      database,
      namespace: 'scope"; DROP TABLE events; --',
      indexes: ["name"],
    });
    expect(createTransaction.firstCall.args[0].database).to.equal(database);
    for (const call of query.getCalls()) {
      expect(call.args[0].transaction).to.equal(transaction);
      expect(call.args[0].database).to.equal(database);
    }
    expect(query.firstCall.args[0]).to.deep.equal({
      database,
      transaction,
      text: "SELECT pg_advisory_xact_lock(hashtextextended($1, 0))",
      values: ['blossm-event-store:scope"; DROP TABLE events; --'],
    });
    expect(query.secondCall.args[0].text).to.equal(
      'CREATE SCHEMA IF NOT EXISTS "scope""; DROP TABLE events; --"'
    );
    expect(Object.values(result).map((store) => store.kind)).to.deep.equal([
      "events",
      "snapshots",
      "counts",
      "blockchain",
    ]);
    expect(result.eventStore.table).to.equal(
      '"scope""; DROP TABLE events; --"."events"'
    );
    const ddl = query
      .getCalls()
      .map((call) => call.args[0].text)
      .join("\n");
    expect(ddl).to.include("idempotency text NOT NULL UNIQUE");
    expect(ddl).to.include("nonce text NOT NULL UNIQUE");
    expect(ddl).to.include("UNIQUE (root, number)");
    expect(ddl).to.include("9007199254740991");
    expect(ddl.match(/USING gin/g)).to.have.length(2);
    expect(ddl).not.to.include("DROP TABLE IF");
  });

  it("omits optional document indexes without declaring query paths", async () => {
    const query = fake.resolves({ rows: [] });
    replace(deps, "db", { query, createTransaction: ({ fn }) => fn({}) });
    const result = await stores({ database });
    expect(result.eventStore.table).to.equal(eventStore.table);
    expect(
      query.getCalls().some((call) => call.args[0].text.includes("USING gin"))
    ).to.equal(false);
  });

  it("passes parameterized queries and explicit transactions to the vendor", async () => {
    const transaction = {};
    const query = fake.resolves({ rows: [{ doc: event }] });
    replace(deps, "db", { query });
    expect(
      await find({
        store: eventStore,
        query: { "headers.root": "root" },
        transaction,
      })
    ).to.deep.equal([event]);
    expect(query.firstCall.args[0]).to.deep.equal({
      database,
      transaction,
      text: 'SELECT doc FROM "public"."events" WHERE root = $1 LIMIT $2',
      values: ["root", 100],
    });
  });

  it("inserts a complete event batch in a single SQL statement", async () => {
    const second = {
      ...event,
      hash: "next",
      headers: { ...headers, number: 1, nonce: "root_1", idempotency: "next" },
    };
    const transaction = {};
    const query = fake.resolves({ rows: [{ doc: event }, { doc: second }] });
    replace(deps, "db", { query });
    expect(
      await create({ store: eventStore, data: [event, second], transaction })
    ).to.deep.equal([event, second]);
    expect(query.callCount).to.equal(1);
    const call = query.firstCall.args[0];
    expect(call.transaction).to.equal(transaction);
    expect(call.text).to.include(
      "VALUES ($1, $2, $3, $4, $5, $6, $7), ($8, $9, $10, $11, $12, $13, $14)"
    );
    expect(call.values).to.have.length(14);
    expect(JSON.parse(call.values[6])).to.deep.equal(event);
    expect(JSON.parse(call.values[13])).to.deep.equal(second);
  });

  it("does not issue an invalid INSERT for an empty batch", async () => {
    const query = fake();
    replace(deps, "db", { query });
    expect(await create({ store: eventStore, data: [] })).to.deep.equal([]);
    expect(query.callCount).to.equal(0);
  });

  it("upserts snapshots by hash and preserves binary bytes", async () => {
    const events = Buffer.from([0, 255]);
    const doc = { hash: "snapshot", headers, state: {} };
    const data = { ...doc, events };
    const query = fake.resolves({ rows: [{ doc, events }] });
    replace(deps, "db", { query });
    expect(await save({ store: snapshotStore, data })).to.deep.equal(data);
    expect(query.firstCall.args[0].text).to.include(
      "ON CONFLICT (hash) DO UPDATE SET"
    );
    expect(query.firstCall.args[0].values.at(-1)).to.equal(events);
  });

  it("streams decoded documents without materializing the result set", async () => {
    const events = Buffer.from([1]);
    const doc = { hash: "snapshot", headers, state: {} };
    const fn = fake.resolves();
    const transaction = {};
    const streamFake = fake(async ({ fn }) => fn({ doc, events }));
    replace(deps, "db", { stream: streamFake });
    await stream({
      store: snapshotStore,
      sort: { "headers.number": 1 },
      parallel: 3,
      transaction,
      fn,
    });
    const call = streamFake.firstCall.args[0];
    expect(call).to.include({ database, transaction, parallel: 3 });
    expect(call.text).not.to.include("LIMIT");
    expect(fn.firstCall.args[0]).to.deep.equal({ ...doc, events });
  });

  it("propagates persistence and callback failures unchanged", async () => {
    const failure = new Error("database unavailable");
    replace(deps, "db", {
      query: fake.rejects(failure),
      stream: ({ fn }) => fn({ doc: event }),
    });
    for (const operation of [
      () => find({ store: eventStore }),
      () => create({ store: eventStore, data: [event] }),
      () =>
        save({
          store: snapshotStore,
          data: { ...event, events: Buffer.from([]) },
        }),
      () =>
        stream({
          store: eventStore,
          fn: async () => {
            throw failure;
          },
        }),
    ]) {
      try {
        await operation();
        expect.fail("Expected failure.");
      } catch (error) {
        expect(error).to.equal(failure);
      }
    }
  });
});
