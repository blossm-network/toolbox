# PostgreSQL event store storage

Owns the five PostgreSQL event-store tables and the document/query mapping shared
by the procedure packages. Use the PostgreSQL event-store server for application
setup; these functions are its persistence dependencies.

```js
import stores, { find } from "@blossm/postgres-event-store-storage";

const { eventStore } = await stores({
  database,
  namespace: "public",
  indexes: [],
});
const events = await find({
  store: eventStore,
  query: { "headers.root": root },
  sort: { "headers.number": 1 },
});
```

`database` is a pool from `@blossm/postgres-database`. An isolated namespace holds
`events`, `snapshots`, `counts`, `blockchain` and `publications`. Initialization uses a transaction
and an advisory lock, creates missing tables/indexes, and never migrates or drops
existing data. The database role must be allowed to create those objects. The
same namespace must retain the same table layout across starts; this package is
not a schema migration tool. A namespace must be well-formed Unicode of 1 to 63
UTF-8 bytes without NUL; a longer name would be truncated by PostgreSQL and an
unpaired surrogate would be encoded as U+FFFD, and either could alias another
store. The name is a quoted identifier, so case, quotes and Unicode
normalization forms are all significant. A namespace separates data, not
access: any role with rights on the schemas reads and writes every namespace.
Use PostgreSQL roles and grants, or separate databases, for authorization.

Event/snapshot root-number pairs, hashes and nonces are unique. Event idempotency
keys and block numbers are unique. Counters and numbers use constrained `bigint`
columns within JavaScript's safe integer range. Counters use their own typed
columns; other normalized documents remain JSONB with typed query metadata.
Snapshot events and block events/snapshots/transactions are stored as `bytea`
and returned as Buffers. Documents are stored exactly as given and dates retain
their JSON representation. Schema casting and validation happen before hashing
in the PostgreSQL event-store server, never in this package.

The supported read grammar is deliberately small:

- Exact metadata equality on `hash`, `headers.root`, `headers.nonce`,
  `headers.number`, `headers.created` and `headers.idempotency` where present.
- Counter equality on `root`, `value` and `updated`.
- `$gt`, `$gte`, `$lt` and `$lte` on numeric/time metadata.
- Dotted `payload` and `state` equality with lax array traversal. Scalar values
  can match array elements. Objects use exact JSONB equality, independent of key
  order; arrays match exactly in order, or as an exact element of another array.
  Null matches explicit null or an entirely absent path.
- `$and` with a nonempty array of such queries, flattened into the same
  conjunction. No other logical operator is translated.
- Sorts on the same typed metadata fields, with directions `1` or `-1`.
- `find` snapshot projections `{ events: 0 }` and `{ "headers.root": 1 }` only.
  Both omit the binary events column; the second returns only `headers.root`.
  `stream` has no `select` option and always returns full documents.

Unsupported fields, operators and projections throw rather than silently changing
the query. SQL values and complete JSONPaths are parameters. Paths are not SQL
identifiers. A nonempty application `indexes` list enables a document-wide GIN
`jsonb_path_ops` index on both events and snapshots; this covers scalar path
predicates beyond the declared paths too. Object/array equality uses a separate
exact comparison and does not claim index acceleration. Root/number/time indexes
are installed independently.

`find` defaults to 100 results; an explicit `null` limit is unbounded. `stream` has no default total limit and delegates
to the vendor's bounded SQL cursor, with sequential callbacks unless `parallel`
is supplied. Both accept a transaction; the vendor also binds reads inside its
transaction callback. `create` inserts one complete event batch atomically;
`save` upserts a snapshot or block by hash.

`streamPendingRoots` streams counters like `stream`, restricted to roots whose
count exceeds the latest snapshot's `lastEventNumber + 1` (or zero when there
is no snapshot). The restriction is part of the SQL source, so range filters,
ordering and `limit` apply only to uncovered roots.

Pending publication documents use the same transactional `create` operation as
events. The publications table has a unique event hash, a committed timestamp,
JSONB notice and a failed-attempt counter. `findPublications` reads a bounded
batch in attempts/created/hash order; `removePublication` and
`incrementPublicationAttempts` use parameterized hashes. The shared delivery
loop owns acknowledgment-before-delete and retry policy; storage only executes
its PostgreSQL operations. Initializing an existing namespace creates the new
outbox table without reconstructing notices for historical events.

## Tests

`yarn test` uses a stubbed vendor and needs no database. The native Mocha suite
lives under `test/integration`, is excluded from the ordinary run, and requires
a disposable UTF-8 PostgreSQL 14+ database whose role may create schemas. Every
schema it creates carries one random marker; it drops only those schemas and
ends its pools afterward. Do not point it at a production database.

```sh
TEST_POSTGRES_URL='postgresql://localhost/blossm_test' \
  yarn lerna run test:integration --scope @blossm/postgres-event-store-storage --stream
```

It imports only this package and the vendor, and covers:

- Cold initialization of one namespace by eight independent pools, the exact
  table/index layout, warm reruns that keep stored data, and full DDL rollback
  when initialization fails part way against an incompatible table.
- Identical roots and hashes kept apart across namespaces differing only by
  case, quoting, Unicode normalization or the final character of a 63-byte
  name; rejection of empty, NUL, overlong, ill-formed and `pg_` names without
  creating or aliasing a schema.
- Hostile namespaces, metadata values, publication hashes and JSONPath names
  and values treated as literals, with unsupported operators, sorts and
  projections rejected, while a sentinel schema, table and event stay intact.
- Each uniqueness constraint by name, upsert by hash, safe-integer bounds on
  numbers and counters, and all-or-nothing multi-row inserts.
- Exact JSON and binary round trips through `create`, `save`, `find` and
  `stream`, and both `find` snapshot projections.
- Pending-root coverage filtering before ordering and limits, the
  `lastEventNumber + 1` boundary, latest-snapshot selection, and range, sort
  and null/zero/default limit semantics.

Limits of that evidence: one role and one database, so it shows no access
control between namespaces. Concurrency is cold initialization only; concurrent
appends and transaction retries belong to the vendor and server suites. JSON
round trips are exact within JSONB's contract: key order, duplicate keys and
`undefined` members are not preserved, and text containing U+0000 or an unpaired
surrogate is rejected rather than altered. It does not exercise the 9,362-event
single-insert ceiling, index use by the planner, or layout migration.
