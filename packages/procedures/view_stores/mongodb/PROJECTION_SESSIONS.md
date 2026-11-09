# Cooperating projection plays

Generated remote projections acquire one destination lease before reading any
aggregate or fact, buffer ordered view operations, and synchronously commit the
lease fence, mutation batch and stable play receipt in one Mongo transaction.
Competing projection plays retry after a busy/expired lease. An expired owner
cannot commit after takeover. Lost commit responses do not repeat supported
incremental mutations. Direct internal PUT/DELETE remain available and are outside
this guarantee: they can race with projection plays. This is not universal writer
serialization or a distributed snapshot of source services and facts.

There is one current remote contract, without prepared/activation modes. It needs
a Mongo replica set and majority transactions. Local mode preserves direct writes
and does not acquire leases, require stable play IDs or run batch transactions.
Both modes share transform, query, mutation and metadata mapping owners.

Pub/Sub subscription/message IDs identify live plays. RPC/CLI put a stable play ID
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
`test:integration` Mocha suite under test/integration. Set TEST_MONGODB_URL to a
disposable replica-set URL; the suite creates and drops its own database. It checks
stale-play serialization, fencing/takeover, rollback, stable retry receipts,
ordered query operations, bounds, metadata and postcommit notification behavior.
