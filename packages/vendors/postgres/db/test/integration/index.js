import { randomUUID } from "node:crypto";
import { setTimeout as sleep } from "node:timers/promises";
import { expect } from "chai";
import { connect, query, createTransaction, stream } from "../../index.js";

if (!process.env.TEST_POSTGRES_URL)
  throw new Error(
    "Set TEST_POSTGRES_URL to a disposable PostgreSQL test database.",
  );

const schema = `blossm_test_${randomUUID().replaceAll("-", "")}`;
const table = `${schema}.writes`;
const counter = `${schema}.counter`;

const failure = async (fn) => {
  try {
    await fn();
  } catch (err) {
    return err;
  }
  throw new Error("Expected the operation to fail.");
};

describe("PostgreSQL database integration", function () {
  this.timeout(20000);
  // One connection: any leaked client fails the next driver query within the
  // connection timeout, and the session a test used is the session reused.
  let database;
  // Independent session for concurrent writers and for reading committed state.
  let outside;

  const write = (id) =>
    query({ database, text: `INSERT INTO ${table} VALUES ($1)`, values: [id] });
  const written = async () =>
    (await outside.query(`SELECT id FROM ${table} ORDER BY id`)).rows.map(
      ({ id }) => id,
    );
  // Runs on the driver pool, so it also proves the pool can serve a client.
  const session = async () =>
    (
      await query({
        database,
        text: `SELECT pg_backend_pid() AS pid, (SELECT count(*)::integer
          FROM pg_cursors WHERE name LIKE 'blossm_cursor_%') AS cursors`,
      })
    ).rows[0];
  const expectReleased = () => {
    expect(database.totalCount - database.idleCount).to.equal(0);
    expect(database.waitingCount).to.equal(0);
  };

  before(async () => {
    const connection = {
      connectionString: process.env.TEST_POSTGRES_URL,
      application_name: schema,
      max: 1,
      connectionTimeoutMillis: 5000,
    };
    database = connect(connection);
    outside = connect(connection);
    await outside.query(`CREATE SCHEMA ${schema}`);
    await outside.query(`CREATE TABLE ${table} (id text PRIMARY KEY)`);
    await outside.query(`CREATE TABLE ${counter} AS SELECT 0 AS n`);
  });

  beforeEach(() => outside.query(`TRUNCATE ${table}`));

  after(async () => {
    try {
      // A leaked transaction must not block the drop or the pool shutdown.
      await outside.query(
        `SELECT pg_terminate_backend(pid) FROM pg_stat_activity
          WHERE application_name = $1 AND pid <> pg_backend_pid()`,
        [schema],
      );
      await outside.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    } finally {
      await Promise.allSettled([database.end(), outside.end()]);
    }
  });

  // Real database state with an injected acknowledgement loss: the server
  // really commits, then the checked-out client's query wrapper throws. This
  // is not a network fault; it fixes the outcome a lost reply would leave.
  it("should neither replay nor reuse the client when a real COMMIT loses its injected acknowledgement", async () => {
    const lost = new Error("Injected loss of the COMMIT acknowledgement.");
    let callbacks = 0;
    let client;
    let pid;
    try {
      const error = await failure(() =>
        createTransaction({
          database,
          fn: async (transaction) => {
            callbacks++;
            client = transaction;
            ({ pid } = await session());
            await write("lost-acknowledgement");
            const real = transaction.query.bind(transaction);
            transaction.query = async (text, ...rest) => {
              const result = await real(text, ...rest);
              if (text === "COMMIT") throw lost;
              return result;
            };
          },
        }),
      );
      expect(error).to.equal(lost);
    } finally {
      if (client) delete client.query;
    }
    expect(callbacks).to.equal(1);
    expect(database.totalCount).to.equal(0);
    expect(await written()).to.deep.equal(["lost-acknowledgement"]);
    expect((await session()).pid).not.to.equal(pid);
  });

  it("should reuse one backend for a nested transaction and roll back both writes when its failure propagates", async () => {
    const error = new Error("inner failure");
    const pids = [];
    expect(
      await failure(() =>
        createTransaction({
          database,
          fn: async (outer) => {
            pids.push((await session()).pid);
            await write("outer");
            await createTransaction({
              database,
              fn: async (inner) => {
                expect(inner).to.equal(outer);
                pids.push((await session()).pid);
                await write("inner");
                throw error;
              },
            });
          },
        }),
      ),
    ).to.equal(error);
    expect(pids).to.have.length(2);
    expect(pids[1]).to.equal(pids[0]);
    expect(await written()).to.deep.equal([]);
    expectReleased();
    // The healthy client returned to the pool without a transaction context.
    expect((await session()).pid).to.equal(pids[0]);
    await write("after");
    expect(await written()).to.deep.equal(["after"]);
  });

  it("should reject instead of reporting success when a swallowed statement failure aborted the transaction", async () => {
    const error = await failure(() =>
      createTransaction({
        database,
        fn: async () => {
          await write("aborted");
          const inner = await failure(() =>
            createTransaction({
              database,
              fn: () => query({ database, text: "SELECT 1 / 0" }),
            }),
          );
          expect(inner.code).to.equal("22012");
        },
      }),
    );
    expect(error.message).to.equal(
      "Transaction was aborted; COMMIT rolled it back.",
    );
    expect(await written()).to.deep.equal([]);
    expectReleased();
    expect((await session()).cursors).to.equal(0);
  });

  it("should leave no writes and release the pool after exhausting real serialization failures", async () => {
    let attempts = 0;
    const error = await failure(() =>
      createTransaction({
        database,
        fn: async () => {
          attempts++;
          // The first statement fixes the repeatable-read snapshot.
          await write(`attempt-${attempts}`);
          await outside.query(`UPDATE ${counter} SET n = n + 1`);
          await query({ database, text: `UPDATE ${counter} SET n = n + 1` });
        },
      }),
    );
    expect(error.code).to.equal("40001");
    expect(attempts).to.equal(5);
    expect(await written()).to.deep.equal([]);
    // Only the five concurrent writers committed.
    expect(
      (await outside.query(`SELECT n FROM ${counter}`)).rows,
    ).to.deep.equal([{ n: 5 }]);
    expectReleased();
    await session();
  });

  it("should settle parallel stream callbacks before cleanup and commit none of their writes", async () => {
    const error = new Error("callback failure");
    const settled = [];
    let callbacks = 0;
    let pid;
    expect(
      await failure(() =>
        stream({
          database,
          text: "SELECT generate_series(1, 3) AS n",
          parallel: 3,
          fn: async ({ n }) => {
            callbacks++;
            await write(`row-${n}`);
            if (n === 1) {
              ({ pid } = await session());
              throw error;
            }
            await sleep(50);
            // Would autocommit if rollback had not waited for this sibling.
            await write(`late-${n}`);
            settled.push(n);
          },
        }),
      ),
    ).to.equal(error);
    expect(callbacks).to.equal(3);
    expect(settled.sort()).to.deep.equal([2, 3]);
    expect(await written()).to.deep.equal([]);
    expectReleased();
    expect(await session()).to.deep.equal({ pid, cursors: 0 });
  });

  // Requires PostgreSQL 14+ for pg_terminate_backend(pid, timeout), which
  // returns only after the backend has exited.
  it("should discard the client and keep the query failure when its backend is terminated mid-transaction", async () => {
    let callbacks = 0;
    let pid;
    let queryError;
    const error = await failure(() =>
      createTransaction({
        database,
        fn: async () => {
          callbacks++;
          ({ pid } = await session());
          await write("terminated");
          const { rows } = await outside.query(
            "SELECT pg_terminate_backend($1, 5000) AS terminated",
            [pid],
          );
          expect(rows).to.deep.equal([{ terminated: true }]);
          try {
            await query({ database, text: "SELECT 1" });
          } catch (err) {
            queryError = err;
            throw err;
          }
        },
      }),
    );
    expect(queryError).to.be.an("error");
    expect(error).to.equal(queryError);
    expect(callbacks).to.equal(1);
    expect(database.totalCount).to.equal(0);
    expect(await written()).to.deep.equal([]);
    expect((await session()).pid).not.to.equal(pid);
  });
});
