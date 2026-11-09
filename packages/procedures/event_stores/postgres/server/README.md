# PostgreSQL event store

A PostgreSQL sibling to `@blossm/mongodb-event-store`. It supplies persistence
functions to the existing `@blossm/event-store` server. The generic procedures
still own event normalization, hashing, receipts, reducer replay, snapshots,
block construction and durable publication dispatch. Application handlers do not change.

```js
import eventStore from "@blossm/postgres-event-store";
import handlers from "./handlers.js";

await eventStore({
  connection: {
    host: process.env.PGHOST,
    port: Number(process.env.PGPORT || 5432),
    user: process.env.PGUSER,
    password: await secretFn("postgres-event-store"),
    database: process.env.PGDATABASE,
    max: 4,
  },
  namespace: "bicycle_shop",
  indexes: ["color"],
  handlers,
  publishFn,
  encryptFn,
  createBlockFn,
  signFn,
  blockPublisherPublicKeyFn,
  isPublic: false,
});
```

`connection` accepts native node-postgres Pool options. If omitted, the driver
uses its normal PG environment variables and defaults. Credentials, TLS and
Cloud SQL connectivity belong to the caller. Set the pool size for the total
number of running service instances, not only one process. The example's four
connections are an example budget, not a capacity recommendation.

Use a distinct database or namespace for each event store and environment. The
namespace defaults to `public`; sharing one across unrelated event stores mixes
their data. Startup creates its five tables and indexes transactionally. It
requires DDL permission and does not migrate an existing layout. There is no
process-wide store cache, so a different server cannot inherit another server's
connection or tables.

## Persistence boundaries

The sibling operation packages follow the Mongo adapter's curried function
contracts and `index.js`/`deps.js` seams. Their shared
[storage package](../storage/README.md) owns SQL table layout, query translation
and binary mapping. The [PostgreSQL vendor](../../../../vendors/postgres/db/README.md)
owns connection pools, transactions and bounded cursors.

- Root counters increment transactionally with the event batch; first event
  number is zero. Failed expected-number checks and inserts restore counters.
- Unique constraints enforce event hashes, nonces, idempotency keys and
  root/number pairs, snapshot nonces/root-number pairs, and block numbers.
- Transactions use repeatable-read, including implicit reads made by the generic
  block builder. Serialization/deadlock failures retry with bounded backoff;
  uncertain commit failures are surfaced without replaying the callback.
- Snapshot/block binary fields round-trip as Buffers through `bytea`. Other
  normalized document values are JSONB. The adapter does not use the Mongo
  `schema` option or reproduce Mongoose validation, casting, field stripping or
  defaults. Callers must supply valid JSON payloads/state. This is an explicit
  backend difference, not a claim of automatic Mongo schema parity.
- Query support covers the generic procedures' metadata ranges, numeric/time
  sorts, nested payload/state equality, and snapshot binary exclusion. See the
  storage README for exact semantics and index behavior. There is no arbitrary
  Mongo operator translation. Candidate event/snapshot queries retain their
  existing 100-result limit; streams use bounded cursor batches.
- Event batches use a single atomic insert with seven parameters per event.
  PostgreSQL's 65,535-parameter ceiling currently permits 9,362 events per batch;
  larger batches fail atomically. Chunking within a transaction belongs here if
  application batches need to exceed that ceiling.

The CLI still generates Mongo entrypoints/configuration. Selecting this adapter
currently means composing it directly as above. No view-store adapter, historical
migration, cloud deployment or npm publication is included.

## Durable publication

This adapter supplies the framework-required `publishPendingFn`. Outside local
mode, it inserts a pending notice into `publications` in the same transaction as
the event and root counter. A failed transaction leaves neither event nor notice.
The shared publication formatter and delivery loop come from PR133/PR151; this
adapter must be used with that framework contract, not the older generic runtime.

The generic server attempts one configured batch during startup before listening.
A publication failure is logged without failing startup, and its notices remain
pending. This uses the same dispatcher as request-driven recovery; startup does
not drain an entire backlog or start a background worker.

POST dispatches pending notices after commitment, including duplicate retries.
Recurring `/create-block` requests also drive recovery when no new events arrive.
Direct compositions must arrange those recurring calls; there is no background
worker. Each call attempts one batch in attempts/created/hash order,
retains failed notices and deletes only after publication acknowledges delivery.
One failing topic does not prevent the remainder of the batch from being tried.
Set the server's optional `publicationBatchSize` to a positive safe integer to
bound work per invocation. The shared delivery loop owns the default of 100.
Successful notices are deleted, so the next call selects the outstanding batch
without a cursor or offset; this option does not change action delivery.

Delivery is at least once. Concurrent dispatchers or a stop between publication
and deletion can deliver duplicates; subscribers must tolerate them. A delivery
failure still fails HTTP after event commitment, so retry with the same event
idempotency key. This protects future writes and does not reconstruct historical
missing notifications. Local mode keeps its existing no-publication behavior.
Applications retain the generic block builder's existing root/time selection
rules; this adapter does not change them.

## Verification

From the Toolbox root, run its package tests through the existing Lerna workflow:

```sh
./node_modules/.bin/lerna run test --scope '@blossm/postgres-*' --npm-client npm --stream
```

The real database suite is separate and requires a disposable PostgreSQL database.
The Mocha suites live under `test/integration`; ordinary `npm test` excludes
them. The database suite creates uniquely named schemas, drops only those schemas
afterward, and uses
no cloud services. Do not point tests at a production database.

```sh
TEST_POSTGRES_URL='postgresql://localhost/blossm_test' \
  ./node_modules/.bin/lerna run test:integration \
  --scope @blossm/postgres-event-store --npm-client npm --stream
```

The suite exercises the actual generic POST, aggregate, query and block builder
against PostgreSQL: publication/idempotency, canonical hashes, nested/array
queries, replay beyond one cursor batch, concurrent writes, expected-number and
uniqueness rollback, transaction snapshots, callback cleanup, binary snapshots,
block round trips, concurrent initialization, atomic event/notice rollback,
duplicate retry recovery, scheduled delivery, acknowledgment-before-delete
redelivery and failed-batch rotation. See
[the pinned test and release guide](https://github.com/blossm-network/toolbox/blob/9057978728c833c7fa35ba7e6aed9eecd55f3521/CONTRIBUTING.md) for the repository-wide test and
release workflow.
