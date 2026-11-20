import { randomUUID } from "node:crypto";
import { expect } from "chai";
import { connect } from "@blossm/postgres-database";
import stores, { find } from "@blossm/postgres-event-store-storage";
import createTransaction from "@blossm/postgres-event-store-create-transaction";
import reserveRootCounts from "@blossm/postgres-event-store-reserve-root-counts";
import publishPending from "@blossm/postgres-event-store-publish-pending";

import saveEvents from "../../index.js";

if (!process.env.TEST_POSTGRES_URL)
  throw new Error(
    "Set TEST_POSTGRES_URL to a disposable PostgreSQL test database.",
  );

// The only schema this suite creates and drops. Its name also labels every
// session the suite opens, so cleanup can end a leaked transaction.
const namespace = `bso_${randomUUID().replaceAll("-", "")}`;
const committed = "2026-10-22T00:00:00.000Z";

// Only root/number is meaningful, so a duplicate names exactly one constraint.
const event = (root, number, headers) => {
  const id = randomUUID();
  return {
    hash: `hash-${id}`,
    headers: {
      nonce: `nonce-${id}`,
      root,
      number,
      action: "set",
      topic: "topic",
      created: committed,
      committed,
      idempotency: `idempotency-${id}`,
      ...headers,
    },
    payload: {},
  };
};
const notice = ({ hash, headers }) => [
  { hash, root: headers.root, action: "set", timestamp: headers.committed },
  headers.topic,
];

const failure = async (fn) => {
  try {
    await fn();
  } catch (err) {
    return err;
  }
  throw new Error("Expected the operation to fail.");
};

describe("Postgres event store operations integration", function () {
  this.timeout(20000);
  const pools = [];
  let database;
  let db;
  let transact;
  let reserve;
  let save;

  const pool = (options) => {
    const created = connect({
      connectionString: process.env.TEST_POSTGRES_URL,
      connectionTimeoutMillis: 5000,
      ...options,
    });
    pools.push(created);
    return created;
  };
  const numbers = async () =>
    (
      await find({
        store: db.eventStore,
        sort: { "headers.number": 1 },
        limit: null,
      })
    ).map(({ headers }) => headers.number);
  const counts = async () =>
    Object.fromEntries(
      (await find({ store: db.countsStore, limit: null })).map(
        ({ root, value }) => [root, value],
      ),
    );
  const outbox = async () =>
    (
      await database.query(
        `SELECT hash, attempts::integer AS attempts
          FROM ${db.publicationsStore.table} ORDER BY created, hash`,
      )
    ).rows;
  // The generic post transaction: reserve, then write the reserved numbers.
  const post = ({ root, amount }) =>
    transact(async (transaction) => {
      const { value } = await reserve({ root, amount, transaction });
      const events = Array.from({ length: amount }, (_, index) =>
        event(root, value - amount + index),
      );
      await save({ events, transaction });
      return events;
    });

  before(async () => {
    database = pool({ max: 8 });
    db = await stores({ database, namespace });
    transact = createTransaction({ database });
    reserve = reserveRootCounts({ countsStore: db.countsStore });
    save = saveEvents({
      eventStore: db.eventStore,
      publicationsStore: db.publicationsStore,
      handlers: { set() {} },
    });
  });

  beforeEach(() =>
    database.query(
      `TRUNCATE ${Object.values(db)
        .map(({ table }) => table)
        .join(", ")}`,
    ),
  );

  after(async () => {
    try {
      await database.query(`DROP SCHEMA IF EXISTS "${namespace}" CASCADE`);
    } finally {
      await Promise.allSettled(pools.map((pool) => pool.end()));
    }
  });

  describe("root count reservations", () => {
    it("should hand concurrent single-statement reservations contiguous nonoverlapping ranges", async () => {
      const amounts = Array.from({ length: 16 }, (_, index) => (index % 3) + 1);
      const results = await Promise.allSettled(
        amounts.map((amount) => reserve({ root: "root", amount })),
      );

      expect(results.map(({ status }) => status)).to.deep.equal(
        amounts.map(() => "fulfilled"),
      );
      // Each worker owns [value - amount, value): sorted, every range starts
      // where the previous one ended.
      const ranges = results
        .map(({ value }, index) => [value.value - amounts[index], value.value])
        .sort(([a], [b]) => a - b);
      let end = 0;
      for (const [start, next] of ranges) {
        expect(start).to.equal(end);
        end = next;
      }
      const total = amounts.reduce((sum, amount) => sum + amount, 0);
      expect(end).to.equal(total);
      expect(await counts()).to.deep.equal({ root: total });
    });

    it("should keep counts, events and notices exact when concurrent transactions reserve and save", async () => {
      const amounts = Array.from({ length: 8 }, (_, index) => (index % 3) + 1);
      const results = await Promise.allSettled(
        amounts.map((amount) => post({ root: "root", amount })),
      );

      // The vendor retries a serialization failure a bounded number of times;
      // exhausting that is the only acceptable way to lose this race.
      const rejected = results.filter(({ status }) => status == "rejected");
      expect(rejected.map(({ reason }) => reason.code)).to.deep.equal(
        rejected.map(() => "40001"),
      );
      const saved = results.flatMap(({ value = [] }) => value);
      expect(saved).to.not.be.empty;
      const expected = saved.map((_, index) => index);
      expect(
        saved.map(({ headers }) => headers.number).sort((a, b) => a - b),
      ).to.deep.equal(expected);
      expect(await numbers()).to.deep.equal(expected);
      expect(await counts()).to.deep.equal({ root: saved.length });
      expect((await outbox()).map(({ hash }) => hash).sort()).to.deep.equal(
        saved.map(({ hash }) => hash).sort(),
      );
    });

    it("should roll a reservation back with its failed transaction", async () => {
      await reserve({ root: "root", amount: 2 });
      const error = new Error("abandon");

      expect(
        await failure(() =>
          transact(async (transaction) => {
            const { value } = await reserve({
              root: "root",
              amount: 3,
              transaction,
            });
            expect(value).to.equal(5);
            await reserve({ root: "other", amount: 1, transaction });
            throw error;
          }),
        ),
      ).to.equal(error);
      expect(await counts()).to.deep.equal({ root: 2 });
    });
  });

  describe("event and notice writes", () => {
    it("should map a real duplicate, keep its cause and constraint, and undo the transaction", async () => {
      const [original] = await post({ root: "root", amount: 1 });

      const error = await failure(() =>
        transact(async (transaction) => {
          await reserve({ root: "root", amount: 1, transaction });
          await save({ events: [event("root", 0)], transaction });
        }),
      );

      expect(error.statusCode).to.equal(412);
      expect(error.message).to.equal("Duplicates.");
      expect(error.publicInfo).to.deep.equal({
        constraint: "events_root_number_key",
      });
      expect(error.cause().code).to.equal("23505");
      expect(error.cause().constraint).to.equal("events_root_number_key");
      expect(await numbers()).to.deep.equal([0]);
      expect(await counts()).to.deep.equal({ root: 1 });
      expect(await outbox()).to.deep.equal([
        { hash: original.hash, attempts: 0 },
      ]);
    });

    it("should discard the inserted events and reservation when the notice insert fails", async () => {
      // Valid for the events table; only its notice lacks a committed time.
      const uncommitted = event("root", 0, { committed: undefined });
      const attempt = (events) =>
        failure(() =>
          transact(async (transaction) => {
            await reserve({ root: "root", amount: 1, transaction });
            await save({ events, transaction });
          }),
        );

      const raw = await attempt([uncommitted]);
      expect(raw.code).to.equal("23502");
      expect(raw.table).to.equal("publications");
      expect(raw.statusCode).to.equal(undefined);

      // A notice already stored under the hash of an otherwise new event.
      const colliding = event("root", 0);
      await database.query(
        `INSERT INTO ${db.publicationsStore.table} (hash, created, doc)
          VALUES ($1, $2, '{}')`,
        [colliding.hash, committed],
      );
      const mapped = await attempt([colliding]);
      expect(mapped.statusCode).to.equal(412);
      expect(mapped.publicInfo).to.deep.equal({
        constraint: "publications_pkey",
      });
      expect(mapped.cause().code).to.equal("23505");

      expect(await numbers()).to.deep.equal([]);
      expect(await counts()).to.deep.equal({});
      expect(await outbox()).to.deep.equal([
        { hash: colliding.hash, attempts: 0 },
      ]);

      // Control: the events table accepts the same event, so each failure
      // above came after the event insert.
      await saveEvents({ eventStore: db.eventStore, handlers: { set() {} } })({
        events: [uncommitted],
      });
      expect(await numbers()).to.deep.equal([0]);
    });
  });

  describe("pending notice delivery", () => {
    it("should keep a rejected notice, count the attempt, and remove notices only once delivered", async () => {
      const events = [0, 1, 2].map((number) =>
        event("root", number, {
          topic: `topic-${number}`,
          committed: new Date(Date.UTC(2026, 0, 1, 0, number)).toISOString(),
        }),
      );
      await transact((transaction) => save({ events, transaction }));
      const rejection = new Error("subscriber unavailable");
      const calls = [];
      let available = false;
      const drain = publishPending({
        publicationsStore: db.publicationsStore,
        batchSize: 2,
        publishFn: async (data, topic) => {
          calls.push([data, topic]);
          if (!available && data.hash == events[1].hash) throw rejection;
        },
      });

      // One bounded batch: the first notice is acknowledged, the second is not.
      expect(await failure(drain)).to.equal(rejection);
      expect(calls).to.deep.equal([notice(events[0]), notice(events[1])]);
      expect(await outbox()).to.deep.equal([
        { hash: events[1].hash, attempts: 1 },
        { hash: events[2].hash, attempts: 0 },
      ]);

      // Still rejected: retried after the untried notice, and counted again.
      expect(await failure(drain)).to.equal(rejection);
      expect(calls.slice(2)).to.deep.equal([
        notice(events[2]),
        notice(events[1]),
      ]);
      expect(await outbox()).to.deep.equal([
        { hash: events[1].hash, attempts: 2 },
      ]);

      available = true;
      await drain();
      expect(calls.slice(4)).to.deep.equal([notice(events[1])]);
      expect(await outbox()).to.deep.equal([]);
      await drain();
      expect(calls).to.have.length(5);
    });

    it("should deliver a notice again when its removal was lost after a successful delivery", async () => {
      const [saved] = await post({ root: "root", amount: 1 });
      const calls = [];
      // The removal waits on a row lock held elsewhere, then times out.
      const impatient = pool({ max: 2, options: "-c lock_timeout=200" });
      const drain = publishPending({
        publicationsStore: { ...db.publicationsStore, database: impatient },
        publishFn: async (data, topic) => calls.push([data, topic]),
      });

      const holder = await database.connect();
      let error;
      try {
        await holder.query("BEGIN");
        await holder.query(
          `SELECT 1 FROM ${db.publicationsStore.table} WHERE hash = $1 FOR UPDATE`,
          [saved.hash],
        );
        error = await failure(drain);
      } finally {
        await holder.query("ROLLBACK").finally(() => holder.release());
      }

      expect(error.code).to.equal("55P03");
      expect(calls).to.deep.equal([notice(saved)]);
      expect(await outbox()).to.deep.equal([{ hash: saved.hash, attempts: 0 }]);

      await drain();
      expect(calls).to.deep.equal([notice(saved), notice(saved)]);
      expect(await outbox()).to.deep.equal([]);
    });
  });
});
