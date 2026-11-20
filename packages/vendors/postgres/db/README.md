# PostgreSQL database

Small `pg` pool, query, transaction and cursor helpers. Connection options are
passed directly to `pg.Pool`; the application owns pool lifetime and `pool.end()`.

```js
import {
  connect,
  query,
  createTransaction,
  stream,
} from "@blossm/postgres-database";

const database = connect({
  connectionString: process.env.DATABASE_URL,
  max: 5,
});

await createTransaction({
  database,
  fn: async (transaction) => {
    await query({
      database,
      transaction,
      text: "SELECT $1::integer",
      values: [1],
    });
  },
});

await stream({
  database,
  text: "SELECT generate_series(1, 10) AS number",
  fn: console.log,
});
await database.end();
```

Transactions use repeatable-read isolation. Queries and streams inside a
transaction callback automatically use its client for that database, even when
the caller omits `transaction`. Nested transactions on the same database reuse
the current transaction; they do not create savepoints.

Atomicity is per database pool. A transaction nested on a different pool is
independent: it commits on its own, stays committed if the outer transaction
rolls back, and runs again when the outer callback retries. Do not nest pools
for writes that need cross-database atomicity.

Serialization failures and deadlocks before commit retry the entire transaction
callback up to five attempts, only after successful rollback. Retries release the
client before a bounded exponential delay with jitter. Keep external side
effects outside that callback. Commit errors are propagated without replaying
work, and failed rollback or uncertain commit discards the connection. A
`COMMIT` that PostgreSQL answers with `ROLLBACK`, because a statement failure
was caught inside the callback, rejects instead of reporting success. Connection
errors on a checked-out transaction client surface through its queries, not as
an unhandled `error` event.

Streams fetch at most 100 rows per batch using SQL cursors. They await callbacks
in order by default; `parallel` bounds concurrent callbacks and `limit` bounds
rows. Callbacks can query the same client. A stream outside an existing
transaction owns a transaction and never retries its callbacks. Cursor cleanup
preserves the original callback/query failure, and concurrent callbacks settle
before cleanup. Streams inside an existing transaction share its retry policy.

## Tests

`yarn test` uses stubbed clients and needs no database. The native Mocha suite
lives under `test/integration`, is excluded from the ordinary run, and requires
a disposable PostgreSQL 14+ database. It creates one uniquely named schema,
drops only that schema and ends its pools afterward. Do not point it at a
production database.

```sh
TEST_POSTGRES_URL='postgresql://localhost/blossm_test' \
  yarn lerna run test:integration --scope @blossm/postgres-database --stream
```

It covers a really committed transaction whose `COMMIT` acknowledgement is lost
by injection at the client (not a network fault), nested reuse of one backend
with rollback, a `COMMIT` answered with `ROLLBACK`, exhaustion of real
serialization failures, parallel stream callback failure cleanup and a backend
terminated mid-transaction.
