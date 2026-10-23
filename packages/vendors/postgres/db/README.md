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

Serialization failures and deadlocks before commit retry the entire transaction
callback up to five attempts, only after successful rollback. Retries release the
client before a bounded exponential delay with jitter. Keep external side
effects outside that callback. Commit errors are propagated without replaying
work, and failed rollback or uncertain commit discards the connection.

Streams fetch at most 100 rows per batch using SQL cursors. They await callbacks
in order by default; `parallel` bounds concurrent callbacks and `limit` bounds
rows. Callbacks can query the same client. A stream outside an existing
transaction owns a transaction and never retries its callbacks. Cursor cleanup
preserves the original callback/query failure, and concurrent callbacks settle
before cleanup. Streams inside an existing transaction share its retry policy.
