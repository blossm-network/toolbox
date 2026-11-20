A postgres event store server event saving function.

It inserts one event batch and, when a publications store is configured, one
pending notice per event through the same transaction, so events and their
notices commit or roll back together. A notice store without a transaction is
rejected before any insert. A unique violation (`23505`) from either insert
becomes a precondition-failed error that keeps the driver error as its cause
and names the violated constraint in `info.constraint`. Every other error is
rethrown unchanged, so the transaction owner still sees retryable codes.

## Tests

`yarn test` stubs storage and needs no database. The native Mocha suite under
`test/integration` is excluded from that run. It composes this package with the
transaction, root count and pending publication operations and the storage
package, never the server. It needs a disposable UTF-8 PostgreSQL 14+ database
whose role may create schemas. It creates one randomly named schema, drops only
that schema and ends its pools afterward.
Do not point it at a production database.

```sh
TEST_POSTGRES_URL='postgresql://localhost/blossm_test' \
  yarn lerna run test:integration --scope @blossm/postgres-event-store-save-events --stream
```

It covers:

- Concurrent single-statement reservations on one root receiving contiguous,
  nonoverlapping ranges with an exact final count.
- Concurrent transactions that reserve and then save the reserved numbers:
  stored event numbers, the count and the notices agree exactly with the
  transactions that committed.
- A reservation rolled back with its failed transaction.
- A real duplicate mapped with its cause and constraint, and a real
  not-null violation rethrown unmapped.
- Events and the reservation discarded when the notice insert fails after the
  event insert.
- A rejected delivery keeping its notice with a counted attempt, removal only
  after a successful delivery, and redelivery when the removal is lost after a
  successful delivery.

Limits of that evidence: one database, one role and one process. A transaction
that loses the reservation race is retried by the vendor a bounded number of
times, so under contention a caller can still receive `40001`; the suite
accepts that outcome and asserts only that committed state stays exact. Lost
removal is produced with a row lock and `lock_timeout`, not a process crash or
network fault. Competing publishers, the single-insert size ceiling and server
request handling are not exercised here.
