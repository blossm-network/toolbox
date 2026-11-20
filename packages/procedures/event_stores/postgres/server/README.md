# PostgreSQL event store

A PostgreSQL sibling to `@blossm/mongodb-event-store`. It supplies persistence
functions to the existing `@blossm/event-store` server. The generic procedures
still own hashing, receipts, reducer replay, snapshots, block construction and
durable publication dispatch. This adapter supplies the transaction normalizer
and, for a declared schema, the payload normalizer they call before hashing.
Application handlers do not change.

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
  schema: { color: "String", wheels: { type: "Number", required: true } },
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

The returned promise resolves to `{ close }` once the generic server is
listening. `close()` ends this store's connection pool; it does not stop the
HTTP listener, which the generic server does not expose. If table preparation
or server startup fails, the pool is closed and the original error is thrown.

`connection` accepts native node-postgres Pool options. If omitted, the driver
uses its normal PG environment variables and defaults. Credentials, TLS and
Cloud SQL connectivity belong to the caller. Set the pool size for the total
number of running service instances, not only one process. The example's four
connections are an example budget, not a capacity recommendation.

Use a distinct database or namespace for each event store and environment. The
namespace defaults to `public`; sharing one across unrelated event stores mixes
their data. Startup creates its five tables and indexes transactionally. It
requires DDL permission and does not migrate an existing layout. A namespace
must be 1 to 63 UTF-8 bytes without NUL, PostgreSQL's identifier limit; anything
else is rejected rather than truncated into another store's name. There is no
process-wide store cache, so a different server cannot inherit another server's
connection or tables.

## Declared schema

`schema` takes the same definition the Mongo adapter receives from
`blossm.yaml`. It is formatted by the shared `@blossm/format-mongodb-schema`
and compiled into disconnected Mongoose 9 models with the Mongo store's schema
options. No MongoDB connection is opened, and each server has its own Mongoose
instance.

- **Payloads** are cast, stripped of undeclared fields and validated before the
  generic append transaction reserves counters or computes `pHash`. As in the
  Mongo event store, payload fields are never required and top-level defaults
  are not applied; Mongoose still gives arrays nested inside subdocuments an
  empty default. The result is plain JSON (dates as ISO strings), and exactly
  that value is hashed, inserted as JSONB and returned by reads. The adapter does
  not cast or rehash at insert. An uncastable or non-object payload is a 400 and
  writes nothing.
- **Snapshot state** is hashed by the generic block builder before the adapter
  sees it, so it is checked rather than rewritten. State must validate against
  the schema, including `required` fields, and must already be canonically equal
  to its cast form. Otherwise the snapshot is rejected and the block transaction
  rolls back. A reducer that adds undeclared fields or changes a declared type
  therefore stops block creation for that store until the schema or reducer is
  corrected. The Mongo adapter would instead cast such state on save.
- **Supported types** are String, Number, Boolean, Date, Object (Mixed), nested
  objects and arrays of those. ObjectId, Buffer, Decimal128, BigInt, Map, UUID
  and any other type without a JSON representation are rejected at startup,
  before a connection is opened, as are type names Mongoose does not know.
- **No schema**, or one without fields, leaves payloads and state as the caller's
  raw JSON with no casting, stripping or validation.

This differs from the Mongo adapter in one deliberate way: Mongo hashes the
submitted payload and casts it afterwards on save, while this adapter casts
first so the stored bytes are the hashed bytes. Database-level `unique` options
and Mongo indexes in a schema are not enforced here; use `indexes` for query
paths.

Transaction metadata is always normalized, with or without a schema, by a copy
of the Mongo event model's `tx` definition: declared fields are cast to
strings, claim and path dates become ISO strings, required path fields and
audience types are enforced, and extra claim/path fields are retained. That
definition currently lives in both adapters' server packages; a change to one
must be made to the other.

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
  normalized document values are JSONB, stored as received from the generic
  procedures.
- Query support covers the generic procedures' metadata ranges, numeric/time
  sorts, nested payload/state equality including the aggregate query's `$and`,
  snapshot binary exclusion and root-only snapshot selection. See the storage
  README for exact semantics and index behavior. There is no arbitrary Mongo
  operator translation. Event and snapshot lookups default to 100 results; the
  aggregate query asks for every matching snapshot root. Streams use bounded
  cursor batches.
- Roots without a covering snapshot are selected in SQL, before ordering and
  the caller's limit, by comparing each counter with its latest snapshot's
  `lastEventNumber`. Block building and filtered aggregate queries use this.
- Event batches use a single atomic insert with seven parameters per event.
  PostgreSQL's 65,535-parameter ceiling currently permits 9,362 events per batch;
  larger batches fail atomically. Chunking within a transaction belongs here if
  application batches need to exceed that ceiling.

These packages are at 0.0.1 and have not been published to npm or deployed.
Choosing this adapter for a generated service, and its Cloud SQL, identity and
secret configuration, belong to the Blossm CLI rather than this package. No
view-store adapter or historical migration is included.

## Durable publication

This adapter supplies the framework-required `publishPendingFn`. Outside local
mode, it inserts a pending notice into `publications` in the same transaction as
the event and root counter. A failed transaction leaves neither event nor notice.
The publication formatter and delivery loop are the shared
`@blossm/event-store-create-publication` and `@blossm/event-store-deliver-pending`.

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
and deletion can deliver duplicates; subscribers must tolerate them. Committed POST and block responses acknowledge persistence even when
publication or pending-record deletion fails. The generic server logs safe error
metadata and retains notices for retry; storage and transaction failures still
reject the request. Explicit calls to the raw adapter dispatcher still reject
on delivery errors. Every published notice carries its committed event hash as
`hash` in its metadata, unchanged across retries, so subscribers can identify duplicates. This protects future writes and does not reconstruct historical
missing notifications. Local mode keeps its existing no-publication behavior.
Applications retain the generic block builder's existing root/time selection
rules; this adapter does not change them.

## Verification

From the Toolbox root, run its package tests through the existing Lerna workflow:

```sh
yarn lerna run test --scope '@blossm/postgres-*' --stream --concurrency 2
```

The real database suite is separate and requires a disposable PostgreSQL database.
The Mocha suites live under `test/integration`; ordinary `npm test` excludes
them. The database suite creates uniquely named schemas, drops only those schemas
afterward, and uses
no cloud services. Do not point tests at a production database.

```sh
TEST_POSTGRES_URL='postgresql://localhost/blossm_test' \
  yarn lerna run test:integration --scope @blossm/postgres-event-store --stream
```

The suite exercises the actual generic POST, aggregate, query and block builder
against PostgreSQL: publication/idempotency, canonical hashes, nested/array
queries, replay beyond one cursor batch, concurrent writes, expected-number and
uniqueness rollback, transaction snapshots, callback cleanup, binary snapshots,
block round trips, concurrent initialization, atomic event/notice rollback,
duplicate retry recovery, scheduled delivery, acknowledgment-before-delete
redelivery, failed-batch rotation, snapshot-coverage filtering before a limit,
and a declared schema's cast-before-hash storage and snapshot guard. The unit
suites cover the same schema behavior against the real generic append
transaction with a recording SQL client. See [CONTRIBUTING](../../../../../CONTRIBUTING.md)
for the repository-wide test and release workflow.
