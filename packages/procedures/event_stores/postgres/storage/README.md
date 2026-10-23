# PostgreSQL event store storage

Owns the four PostgreSQL event-store tables and the document/query mapping shared
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
`events`, `snapshots`, `counts` and `blockchain`. Initialization uses a transaction
and an advisory lock, creates missing tables/indexes, and never migrates or drops
existing data. The database role must be allowed to create those objects. The
same namespace must retain the same table layout across starts; this package is
not a schema migration tool.

Event/snapshot root-number pairs, hashes and nonces are unique. Event idempotency
keys and block numbers are unique. Counters and numbers use constrained `bigint`
columns within JavaScript's safe integer range. Counters use their own typed
columns; other normalized documents remain JSONB with typed query metadata.
Snapshot events and block events/snapshots/transactions are stored as `bytea`
and returned as Buffers. Document dates retain their JSON representation; there
is no Mongoose coercion, default insertion or schema validation.

The supported read grammar is deliberately small:

- Exact metadata equality on `hash`, `headers.root`, `headers.nonce`,
  `headers.number`, `headers.created` and `headers.idempotency` where present.
- Counter equality on `root`, `value` and `updated`.
- `$gt`, `$gte`, `$lt` and `$lte` on numeric/time metadata.
- Dotted `payload` and `state` equality with lax array traversal. Scalar values
  can match array elements. Objects use exact JSONB equality, independent of key
  order; arrays match exactly in order, or as an exact element of another array.
  Null matches explicit null or an entirely absent path.
- Sorts on the same typed metadata fields, with directions `1` or `-1`.
- Snapshot projection `{ events: 0 }` only.

Unsupported fields, operators and projections throw rather than silently changing
the query. SQL values and complete JSONPaths are parameters. Paths are not SQL
identifiers. A nonempty application `indexes` list enables a document-wide GIN
`jsonb_path_ops` index on both events and snapshots; this covers scalar path
predicates beyond the declared paths too. Object/array equality uses a separate
exact comparison and does not claim index acceleration. Root/number/time indexes
are installed independently.

`find` defaults to 100 results. `stream` has no default total limit and delegates
to the vendor's bounded SQL cursor, with sequential callbacks unless `parallel`
is supplied. Both accept a transaction; the vendor also binds reads inside its
transaction callback. `create` inserts one complete event batch atomically;
`save` upserts a snapshot or block by hash.
