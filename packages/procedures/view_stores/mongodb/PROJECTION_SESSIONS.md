# Cooperating projection plays

Generated remote projections acquire one destination lease before reading any
aggregate or fact, buffer ordered view operations, and synchronously commit the
lease fence, mutation batch and stable play receipt in one Mongo transaction.
Competing projection plays fail with a retryable conflict while the destination is busy; the caller or existing task/Pub/Sub transport must retry. An expired owner
cannot commit after takeover. Lost commit responses do not repeat supported
incremental mutations. Direct internal PUT/DELETE remain available and are outside
this guarantee: they can race with projection plays. This is not universal writer
serialization or a distributed snapshot of source services and facts.

There is one current remote contract, without prepared/activation modes. It needs
a Mongo replica set and majority transactions. Local mode preserves direct writes
and does not acquire leases, require stable play IDs or run batch transactions.
Both modes apply handler operations in their declared order and share transform, query, mutation and metadata mapping owners. The HTTP adapters and transaction batch use @blossm/view-store-mutations for write/remove/result mapping; Mongo owns persistence and sessions. Local direct operations are sequential so later operations can observe earlier writes; they do not form an atomic batch.

Pub/Sub live plays use a JSON tuple of subscription scope and stable event hash,
which remains the same when outbox republication gets a new transport message ID.
The session-backed Pub/Sub path requires both fields. RPC/CLI put a stable play ID
in the task before submission; replay derives stable child IDs from replay/source
identity. A deliberate new replay has a new replay ID. Receipts are permanent;
retain them with views/control state. Pruning requires an enforced retry window.

The destination advertises a renewable 30-second lease, five-minute transform
deadline, 100 operations/expanded mutations and 64 KiB serialized batch input.
Notification output is limited to 1 MiB before commit; oversized batches roll back.
Source/fact reads remain separately observed snapshots. Application handlers must
only read and return view operations, since external effects are not retry-safe.

Pushes are best effort after persistence. Notification failures are logged and
cannot fail an acknowledged commit. Current view body/groups are reloaded before
sending, and superseded generations are skipped. Another write can occur after
that read; external delivery is not locked or durably ordered. A crash may lose a
push, but receipts suppress repeated persistence. No notification outbox is added.

The owning operation package has offline unit tests and an explicit
`test:integration` Mocha suite under test/integration. Set BLOSSM_TEST_MONGODB_URI to a
disposable replica-set URL; the suite creates and drops its own database. It checks
stale-play serialization, fencing/takeover, rollback, stable retry receipts,
ordered query operations, bounds, metadata and postcommit notification behavior.

Lease expiry uses the destination application clock. Hosts must have reasonable clock synchronization for predictable expiry and availability. Safety against a superseded worker comes from the stored generation and transactional control-row fence, rather than an assumption that every handler stops exactly when its lease expires. A commit holding that fence can finish while a takeover waits for its transaction.
