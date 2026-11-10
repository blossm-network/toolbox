# Aggregate state queries

Nonempty queries find matching snapshots and enumerate every root with events
beyond its latest snapshot through `rootStreamFn({ unsnapshottedOnly: true })`.
Only the union of these roots is replayed, once per root, and checked against
the requested dotted paths. Historical snapshot matches are candidates, so a
stale match is rejected when current state no longer matches. Fields assembled
by different events, reducer-derived fields, falsy values and nested arrays are supported. A path
through an array matches when any element matches the remaining path. Every pair
must match; an empty pair list returns all existing aggregates.

Snapshot predicates can use configured state indexes, with all query pairs joined
by AND. Candidate discovery requests only snapshot root metadata, with no 100-row
limit. Mongo discovers unsnapshotted work by joining counts to each root's latest
snapshot, ordered by `headers.created` descending exactly as aggregation selects
it. A count exceeds the snapshot when `value > lastEventNumber + 1`, since event
numbers start at zero; missing snapshots use `lastEventNumber = -1`.

This avoids replaying unrelated fresh roots. Discovery can still visit all
count metadata and historical snapshots; unindexed predicates can scan snapshots.
Frequent snapshots
keep replay work small; a large unsnapshotted backlog can require replaying most
roots. Candidate roots and results are collected in memory. An empty query uses
the ordinary root stream and returns all existing aggregates. Concurrent writes
can be observed at different times across discovery and replay; this is not a
global point-in-time snapshot. Use a maintained view store for frequent queries
over a large event store.

Composition requires `findSnapshotsFn`, `rootStreamFn`, `findOneSnapshotFn`,
`eventStreamFn` and `handlers`. The generic event-store server supplies them.
`findSnapshotsFn` must support exhaustive `limit: null` lookup and projection;
`rootStreamFn` must support `unsnapshottedOnly`. Payload-history lookups cannot
discover arbitrary reducer-derived state and are not used. Publish these
cooperating packages together after review, without silently mixing the old
composition with the new query package.

Pair values are JSON scalars (strings, numbers, booleans or null), compared with
strict type equality; missing paths do not match null, and paths traverse JSON
fields rather than inherited or primitive JavaScript properties. The public RPC
accepts an array and encodes it as one JSON query parameter, which GET decodes before the
query owner validates it. Malformed JSON and unsupported pair shapes return 400.
Publish the event-store RPC and GET/query composition together.
