import { randomUUID } from "node:crypto";
import hash from "@blossm/hash";
import { expect } from "chai";
import { replace, restore } from "sinon";
import { connect, query as sql } from "@blossm/postgres-database";
import prepareStores, { find } from "@blossm/postgres-event-store-storage";
import post from "@blossm/event-store-post";
import postTransaction from "@blossm/event-store-post-transaction";
import aggregate from "@blossm/event-store-aggregate";
import query from "@blossm/event-store-query";
import createBlockTransaction from "@blossm/event-store-create-block-transaction";

import eventStore from "../index.js";
import deps from "../deps.js";

if (!process.env.TEST_POSTGRES_URL)
  throw new Error(
    "Set TEST_POSTGRES_URL to a disposable PostgreSQL test database."
  );

const namespace = `blossm_test_${randomUUID().replaceAll("-", "")}`;
const handlers = {
  add: (state, { amount = 1, ...rest }) => ({
    ...state,
    ...rest,
    total: (state.total || 0) + amount,
  }),
};
const event = (root, { id = randomUUID(), amount = 1, ...payload } = {}) => ({
  headers: {
    root,
    action: "add",
    domain: process.env.DOMAIN,
    service: process.env.SERVICE,
    network: process.env.NETWORK,
    topic: "added",
    version: 0,
    created: new Date().toISOString(),
    idempotency: id,
  },
  payload: { amount, ...payload },
  context: { shop: { root: "shop", service: "test", network: "test" } },
  groupsAdded: [{ root: "members", service: "test", network: "test" }],
});

const failure = async (fn) => {
  try {
    await fn();
  } catch (err) {
    return err;
  }
  throw new Error("Expected the operation to fail.");
};

describe("Postgres event store integration", function () {
  this.timeout(20000);
  let database;
  let stores;
  let api;
  let published;
  let previousEnv;

  const append = (eventData) =>
    api.createTransactionFn(
      postTransaction({
        ...api,
        eventData,
        tx: { id: randomUUID(), path: [] },
      })
    );
  const read = (root, options) => aggregate(api)(root, options);

  before(async () => {
    previousEnv = { ...process.env };
    Object.assign(process.env, {
      DOMAIN: "counter",
      SERVICE: "test",
      NETWORK: "test",
      NODE_ENV: "test",
    });
    const connection = {
      connectionString: process.env.TEST_POSTGRES_URL,
      max: 12,
    };
    replace(deps.db, "connect", (config) => {
      database = connect(config);
      return database;
    });
    replace(deps, "eventStore", async (options) => options);
    published = [];
    api = await eventStore({
      connection,
      namespace,
      indexes: ["label", "items.code"],
      handlers,
      publishFn: async (...args) => published.push(args),
      encryptFn: async (message) => message,
      signFn: async (hash) => `signed:${hash}`,
      blockPublisherPublicKeyFn: async () => Buffer.from("test-key"),
      isPublic: true,
    });
    restore();
    stores = await prepareStores({ database, namespace });
  });

  beforeEach(async () => {
    await database.query(
      `TRUNCATE ${Object.values(stores)
        .map(({ table }) => table)
        .join(", ")}`
    );
    published.length = 0;
  });

  after(async () => {
    restore();
    if (database && !database.ended) {
      await database.query(`DROP SCHEMA IF EXISTS "${namespace}" CASCADE`);
      await database.end();
    }
    if (previousEnv) {
      for (const key of ["DOMAIN", "SERVICE", "NETWORK", "NODE_ENV"])
        if (previousEnv[key] === undefined) delete process.env[key];
        else process.env[key] = previousEnv[key];
    }
  });

  it("should preserve the generic POST, idempotency, publication and reducer flow", async () => {
    const first = event("bicycle", { amount: 2, label: "pink" });
    const req = {
      body: { eventData: [{ event: first }], tx: { id: "tx", path: [] } },
    };
    let status;
    await post(api)(req, {
      sendStatus: (value) => {
        status = value;
      },
    });
    await post(api)(req, { sendStatus: () => {} });
    expect(status).to.equal(204);
    expect(published.length).to.equal(1);
    expect(await api.countFn({ root: "bicycle" })).to.equal(1);
    expect(await api.countFn({ root: "missing" })).to.equal(0);
    const result = await read("bicycle", { includeEvents: true });
    expect(result.state).to.deep.equal({ label: "pink", total: 2 });
    expect(result.headers.lastEventNumber).to.equal(0);
    expect(result.events[0].headers.nonce).to.equal("bicycle_0");
    const stored = result.events[0];
    expect(hash(stored.headers).create()).to.equal(stored.hash);
    expect(hash(stored.payload).create()).to.equal(stored.headers.pHash);
    expect(hash(stored.context).create()).to.equal(stored.headers.cHash);
    expect(hash(stored.tx).create()).to.equal(stored.headers.tHash);
    expect(result.context).to.deep.equal(first.context);
    expect(result.groups).to.deep.equal(first.groupsAdded);
  });

  it("should order event numbers numerically and await bounded replay callbacks", async () => {
    await append(Array.from({ length: 125 }, () => ({ event: event("many") })));
    const numbers = [];
    await api.eventStreamFn({
      query: { "headers.root": "many" },
      sort: { "headers.number": 1 },
      fn: async (e) => {
        await Promise.resolve();
        numbers.push(e.headers.number);
      },
    });
    expect(numbers).to.deep.equal(Array.from({ length: 125 }, (_, i) => i));
    expect((await read("many")).state.total).to.equal(125);
    expect((await read("many", { eventLimit: 11 })).state.total).to.equal(11);
    expect(
      (await api.findEventsFn({ query: { "headers.root": "many" } })).length
    ).to.equal(100);
  });

  it("should roll counters back on expected-number, handler and duplicate failures, even locally", async () => {
    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = "local";
    try {
      const wrongNumber = await failure(() =>
        append([{ event: event("wrong"), number: 1 }])
      );
      expect(wrongNumber.statusCode).to.equal(412);
      expect(await api.countFn({ root: "wrong" })).to.equal(0);
      const unknown = event("unknown");
      unknown.headers.action = "missing";
      expect(
        (await failure(() => append([{ event: unknown }]))).statusCode
      ).to.equal(400);
      expect(await api.countFn({ root: "unknown" })).to.equal(0);
      const id = randomUUID();
      expect(
        (
          await failure(() =>
            append([
              { event: event("one", { id }) },
              { event: event("two", { id }) },
            ])
          )
        ).statusCode
      ).to.equal(412);
      expect(await api.countFn({ root: "one" })).to.equal(0);
      expect(await api.countFn({ root: "two" })).to.equal(0);
      expect(await read("one")).to.equal(undefined);
    } finally {
      process.env.NODE_ENV = previous;
    }
  });

  it("should allocate contiguous counts under concurrent same-root writes", async () => {
    await Promise.all(
      Array.from({ length: 6 }, () => append([{ event: event("shared") }]))
    );
    expect(await api.countFn({ root: "shared" })).to.equal(6);
    const result = await read("shared", { includeEvents: true });
    expect(result.state.total).to.equal(6);
    expect(result.events.map((e) => e.headers.number)).to.deep.equal([
      0, 1, 2, 3, 4, 5,
    ]);
  });

  it("should complete overlapping multi-root batches in opposite root order", async () => {
    await Promise.all([
      append([{ event: event("a") }, { event: event("b") }]),
      append([{ event: event("b") }, { event: event("a") }]),
    ]);
    expect(await api.countFn({ root: "a" })).to.equal(2);
    expect(await api.countFn({ root: "b" })).to.equal(2);
  });

  it("should reject a raced duplicate without leaving an allocated count", async () => {
    const id = randomUUID();
    const outcomes = await Promise.allSettled([
      append([{ event: event("raced", { id }) }]),
      append([{ event: event("raced", { id }) }]),
    ]);
    expect(
      outcomes.filter(({ status }) => status == "fulfilled").length
    ).to.equal(1);
    expect(
      outcomes.find(({ status }) => status == "rejected").reason.statusCode
    ).to.equal(412);
    expect(await api.countFn({ root: "raced" })).to.equal(1);
  });

  it("should query nested payloads and array elements through the generic query", async () => {
    await append([
      { event: event("pink", { label: "pink", items: [{ code: "basket" }] }) },
      { event: event("blue", { label: "blue", items: [{ code: "light" }] }) },
    ]);
    expect(
      (await query(api)([{ key: "label", value: "pink" }])).map(
        (a) => a.headers.root
      )
    ).to.deep.equal(["pink"]);
    expect(
      (await query(api)([{ key: "items.code", value: "basket" }])).map(
        (a) => a.headers.root
      )
    ).to.deep.equal(["pink"]);
    const injected = `pink\" || true || \"`;
    expect(
      await api.findEventsFn({ query: { "payload.label": injected } })
    ).to.deep.equal([]);
  });

  it("should preserve time bounds, reverse root ordering and string parallel values", async () => {
    const dates = [
      "2026-01-01T00:00:00.000Z",
      "2026-01-02T00:00:00.000Z",
      "2026-01-03T00:00:00.000Z",
    ];
    for (const [i, updated] of dates.entries()) {
      await append([{ event: event(`root-${i}`) }]);
      await database.query(
        `UPDATE ${stores.countsStore.table} SET updated = $1 WHERE root = $2`,
        [updated, `root-${i}`]
      );
    }
    const roots = [];
    await api.rootStreamFn({
      updatedOnOrAfter: dates[0],
      updatedBefore: dates[2],
      fn: (r) => roots.push(r.root),
    });
    expect(roots).to.deep.equal(["root-1", "root-0"]);
    const reversed = [];
    await api.rootStreamFn({
      reverse: true,
      limit: 2,
      fn: (r) => reversed.push(r.root),
    });
    expect(reversed).to.deep.equal(["root-0", "root-1"]);
    const parallel = [];
    await api.rootStreamFn({ parallel: "2", fn: (r) => parallel.push(r.root) });
    expect(parallel.length).to.equal(3);
  });

  it("should use the block transaction snapshot for implicit reads and read its own writes", async () => {
    await append([{ event: event("consistent") }]);
    await api.createTransactionFn(async () => {
      expect(await api.countFn({ root: "consistent" })).to.equal(1);
      const outside = await database.connect();
      try {
        await outside.query(
          `UPDATE ${stores.countsStore.table} SET value = 2 WHERE root = $1`,
          ["consistent"]
        );
      } finally {
        outside.release();
      }
      expect(await api.countFn({ root: "consistent" })).to.equal(1);
      await api.reserveRootCountsFn({ root: "own-write", amount: 1 });
      expect(await api.countFn({ root: "own-write" })).to.equal(1);
    });
    expect(await api.countFn({ root: "consistent" })).to.equal(2);
  });

  it("should close a failed cursor and roll back writes made by its callback", async () => {
    await append([{ event: event("stream") }]);
    const error = new Error("callback failed");
    expect(
      await failure(() =>
        api.createTransactionFn(async () => {
          await api.eventStreamFn({
            query: {},
            fn: async () => {
              await api.reserveRootCountsFn({ root: "rollback", amount: 1 });
              throw error;
            },
          });
        })
      )
    ).to.equal(error);
    expect(await api.countFn({ root: "rollback" })).to.equal(0);
    expect((await read("stream")).state.total).to.equal(1);
  });

  it("should create genesis, snapshots and blocks with the existing generic builder and replay the tail", async () => {
    const makeBlock = () =>
      api.createTransactionFn(
        createBlockTransaction({ ...api, blockLimit: 100 })
      );
    const genesis = await makeBlock();
    expect(genesis.block.headers.number).to.equal(0);
    expect(Buffer.isBuffer(genesis.block.events)).to.equal(true);
    await append([{ event: event("snapshot", { amount: 3, label: "pink" }) }]);
    // Keep the root strictly within the builder's inclusive/exclusive time window.
    await database.query(
      `UPDATE ${stores.countsStore.table} SET updated = $1`,
      ["2021-01-01T00:00:00.000Z"]
    );
    const built = await makeBlock();
    expect(built.block.headers.number).to.equal(1);
    expect(built.block.headers.eCount).to.equal(1);
    expect(built.block.headers.sCount).to.equal(1);
    const stored = await api.latestBlockFn();
    for (const field of ["events", "snapshots", "txs"])
      expect(stored[field].equals(built.block[field])).to.equal(true);
    const snapshot = await api.findOneSnapshotFn({
      query: { "headers.root": "snapshot" },
    });
    expect(snapshot.state.total).to.equal(3);
    expect(Buffer.isBuffer(snapshot.events)).to.equal(true);
    const selected = await api.findOneSnapshotFn({
      query: { "headers.root": "snapshot" },
      select: { events: 0 },
    });
    expect(selected).not.to.have.property("events");
    expect(
      (await query(api)([{ key: "label", value: "pink" }]))[0].state.total
    ).to.equal(3);
    await append([{ event: event("snapshot", { amount: 2 }) }]);
    const result = await read("snapshot", { includeEvents: true });
    expect(result.state.total).to.equal(5);
    expect(result.events.map((e) => e.headers.number)).to.deep.equal([1]);
    expect(
      (await read("snapshot", { timestamp: snapshot.headers.created })).state
        .total
    ).to.equal(3);
    expect(await api.saveSnapshotFn({ snapshot })).to.deep.equal(snapshot);
    expect(await api.saveBlockFn({ block: stored })).to.deep.equal(stored);
  });

  it("should roll snapshot and block writes back together", async () => {
    const block = {
      hash: "block",
      headers: { number: 0, created: new Date().toISOString() },
      events: Buffer.from([0, 255]),
      snapshots: Buffer.from("snapshots"),
      txs: Buffer.from("txs"),
    };
    const snapshot = {
      hash: "snapshot",
      headers: {
        nonce: "root_0",
        root: "root",
        number: 0,
        created: block.headers.created,
      },
      state: { total: 1 },
      events: Buffer.from([1, 0, 255]),
    };
    await failure(() =>
      api.createTransactionFn(async (transaction) => {
        await api.saveSnapshotFn({ snapshot, transaction });
        await api.saveBlockFn({ block, transaction });
        throw new Error("abort");
      })
    );
    expect(await api.latestBlockFn()).to.equal(null);
    expect(await find({ store: stores.snapshotStore })).to.deep.equal([]);
  });

  it("should serialize simultaneous store initialization without partial schemas", async () => {
    const other = `${namespace}_init`;
    try {
      const prepared = await Promise.all(
        Array.from({ length: 3 }, () =>
          prepareStores({ database, namespace: other, indexes: ["label"] })
        )
      );
      expect(prepared.map((s) => s.eventStore.table)).to.deep.equal(
        Array(3).fill(`"${other}"."events"`)
      );
    } finally {
      await database.query(`DROP SCHEMA IF EXISTS "${other}" CASCADE`);
    }
  });

  it("should preserve scalar types, null/missing and exact document/array equality", async () => {
    await append([
      {
        event: event("types", {
          n: 2,
          active: false,
          absent: null,
          tags: ["pink", "blue"],
          details: { color: "pink", size: 2 },
          items: [{ code: "basket" }],
        }),
      },
      {
        event: event("different", { n: "2", active: true, absent: "present" }),
      },
    ]);
    const roots = async (field, value) =>
      (
        await api.findEventsFn({
          query: { [`payload.${field}`]: value },
          sort: { "headers.root": 1 },
        })
      ).map((e) => e.headers.root);
    expect(await roots("n", 2)).to.deep.equal(["types"]);
    expect(await roots("n", "2")).to.deep.equal(["different"]);
    expect(await roots("active", false)).to.deep.equal(["types"]);
    expect(await roots("absent", null)).to.deep.equal(["types"]);
    expect(await roots("missing", null)).to.deep.equal(["different", "types"]);
    expect(await roots("tags", "pink")).to.deep.equal(["types"]);
    expect(await roots("tags", ["pink", "blue"])).to.deep.equal(["types"]);
    expect(await roots("tags", ["blue", "pink"])).to.deep.equal([]);
    expect(await roots("details", { size: 2, color: "pink" })).to.deep.equal([
      "types",
    ]);
    expect(await roots("details", { color: "pink" })).to.deep.equal([]);
    expect(await roots("items.code", "basket")).to.deep.equal(["types"]);
    const plan = await api.createTransactionFn(async (transaction) => {
      await sql({
        database,
        transaction,
        text: "SET LOCAL enable_seqscan = off",
      });
      return sql({
        database,
        transaction,
        text: `EXPLAIN SELECT doc FROM ${stores.eventStore.table} WHERE doc @? $1::jsonpath`,
        values: ['lax $."payload"."n" ? (@ == 2)'],
      });
    });
    expect(plan.rows.map((r) => r["QUERY PLAN"]).join("\n")).to.include(
      "events_document"
    );
  });

  it("should enforce unique event hashes/nonces, snapshot nonces and block numbers", async () => {
    await append([{ event: event("unique") }]);
    const [stored] = await api.findEventsFn({ query: {} });
    const duplicateHash = {
      ...stored,
      headers: {
        ...stored.headers,
        root: "other",
        nonce: "other_0",
        idempotency: randomUUID(),
      },
    };
    expect(
      (await failure(() => api.saveEventsFn({ events: [duplicateHash] })))
        .statusCode
    ).to.equal(412);
    const duplicateNonce = {
      ...duplicateHash,
      hash: "new-hash",
      headers: { ...duplicateHash.headers, nonce: stored.headers.nonce },
    };
    expect(
      (await failure(() => api.saveEventsFn({ events: [duplicateNonce] })))
        .statusCode
    ).to.equal(412);
    expect((await api.findEventsFn({ query: {} })).length).to.equal(1);
    const snapshot = {
      hash: "s",
      headers: {
        nonce: "unique_0",
        root: "unique",
        number: 0,
        created: stored.headers.created,
      },
      state: { total: 1 },
      events: Buffer.from([0, 255]),
    };
    await api.saveSnapshotFn({ snapshot });
    expect(
      (
        await failure(() =>
          api.saveSnapshotFn({ snapshot: { ...snapshot, hash: "s-other" } })
        )
      ).code
    ).to.equal("23505");
    const block = {
      hash: "b",
      headers: { number: 0, created: stored.headers.created },
      events: Buffer.from([255, 0]),
      snapshots: Buffer.alloc(0),
      txs: Buffer.from([128]),
    };
    await api.saveBlockFn({ block });
    expect(
      (
        await failure(() =>
          api.saveBlockFn({ block: { ...block, hash: "b-other" } })
        )
      ).code
    ).to.equal("23505");
    expect((await api.latestBlockFn()).hash).to.equal("b");
  });
});
