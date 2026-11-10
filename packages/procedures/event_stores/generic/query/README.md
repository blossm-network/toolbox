# Aggregate state queries

Queries enumerate every root through `rootStreamFn`, replay its current aggregate,
and compare the requested dotted paths. Fields assembled by different events,
reducer-derived fields, falsy values and nested arrays are supported. A path
through an array matches when any element matches the remaining path. Every pair
must match; an empty pair list returns all existing aggregates.

This is a complete linear scan, not an indexed payload-history approximation.
The root stream must enumerate every persisted root, including roots with
snapshots. Results are collected in memory because this API returns an array.
Use a maintained view store for frequent queries over a large event store.
Concurrent writes can be observed at different times across roots; this scan is
not a global point-in-time snapshot.

Composition requires `rootStreamFn`, `findOneSnapshotFn`, `eventStreamFn` and
`handlers`. The generic event-store server supplies them. Direct consumers must
provide `rootStreamFn`; historical `findEventsFn`/`findSnapshotsFn` candidate
lookups are no longer used. Publish these cooperating packages together after
review, without silently mixing the old composition with the new query package.

Pair values are JSON scalars (strings, numbers, booleans or null), compared with
strict type equality; missing paths do not match null. The public RPC accepts an
array and encodes it as one JSON query parameter, which GET decodes before the
query owner validates it. Malformed JSON and unsupported pair shapes return 400.
Publish the event-store RPC and GET/query composition together.
