# Fenced projection sessions

This opt-in protocol serializes a whole projection destination, including its
aggregate and fact reads. It commits ordered view updates/deletes and a durable
play receipt in one Mongo transaction. Older overlapping plays cannot overwrite
newer persistent bodies or resource groups.

It requires a replica set with transactions. Verification used local MongoDB
8.0.34; no existing deployment's topology or activation state is assumed.
The database identity must read control metadata and, for prepared/fenced mode,
create/update control and receipt collections and run view transactions.

## Activation and rollback

Existing configurations retain legacy behavior. Both projection and view store
must support this protocol before it is activated.

1. Pause projection triggers and replay. Quiesce and drain **all** legacy writes,
   queued tasks and in-flight HTTP requests. Remove binaries that do not understand
   this protocol. Back up views and metadata together. This barrier is required
   **before first preparation**: a request that already read an unprepared state
   cannot be retroactively fenced.
2. Deploy the view store with `consistency: prepared` in blossm.yaml. Prepared
   legacy mutations check/write the same control document as activation, inside
   their view transaction. A prepared mutation racing activation therefore
   finishes first or aborts. Verify replica-set support and index readiness.
3. Keep legacy traffic paused. Deploy the projection and its matching view store
   with `consistency: fenced`. Legacy PUT/DELETE now return 409. Do not leave old
   queued writes retrying indefinitely. Confirm both services target the same
   destination database before resuming traffic.
4. Resume one play and duplicate delivery, verify the view and receipt, then
   resume normal triggers and replay.

Preparation/activation persist in `projection_control`; removing a config flag
does not undo them. Rolling back to a binary that ignores metadata is unsafe.
Changing protocol state requires another fleet-wide quiescence and deliberate
reconciliation of views, control state, receipts and queued work. For an empty
destination with no writers, preparation and activation can occur immediately.
Standalone local Mongo does not satisfy this transaction contract.

## Play and retry contract

- A destination-wide lease begins **before** the triggering aggregate read and
  covers all source/fact reads and transformation. Handlers must only read and
  return view operations; irreversible external effects are not made retry-safe.
- Pub/Sub uses subscription/message ID. Projection RPC generates a play ID once
  before queue submission or preserves an explicit ID. Retries reuse it. A
  deliberate new replay uses a new ID even for an unchanged source revision.
  Replay fan-out derives each child ID from replay ID plus source identity/root,
  so a partially completed replay task can retry without duplicating its children.
  Direct CLI execution puts the play/replay ID in the task body before enqueue;
  existing Cloud Tasks deliveries can use their stable task-name header.
- Activation, lease writes and receipt reconciliation use majority durability.
  Commit writes the lease fence, every view mutation and receipt in one
  snapshot/majority transaction. Takeover cannot pass an in-flight commit, and
  an expired owner cannot commit after takeover.
- Fenced plays buffer operations instead of enqueueing downstream writes. Handler
  order is retained. Query-selected targets are resolved inside the transaction
  after preceding operations, with the existing query hook and context mapping.
- A successful receipt suppresses repeated persistence after duplicate delivery
  or a lost commit response. `$inc`/`$push` are not reapplied. An aborted play
  reruns the whole read/transform phase through normal delivery retry.
- A busy/lost lease returns 409 for Pub/Sub/Cloud Tasks retry. There is no unbounded
  in-process retry. Heartbeats stop/drain before commit; uncertain renewal prevents
  submission. Failed release delays recovery until expiry without repeating an
  acknowledged commit.

This does not create a distributed snapshot across source services. Facts expose
application bodies without a trustworthy revision frontier. Cached/stale facts
remain a source contract issue; serialization fixes overlapping projection writes
without promising global fact freshness.

## Bounds, notifications and metadata

The destination advertises a renewable 30-second lease, a five-minute transform
deadline, at most 100 input
operations and 64 KiB of serialized operation data. Query expansion is also
limited to 100 total mutations. Client checks use advertised limits; the server
validates before mutation and rolls back oversized query expansion. There is no
silently split partial commit. Larger projections need independently correct
plays. Notification results are limited to 1 MiB before commit; overflow aborts.
The transform deadline stops renewal and batch submission. Arbitrary read-only
async work may finish later; it cannot add operations or commit after the session
stops. Commit is also subject to the configured Mongo transaction timeouts.

Pushes are best effort after persistence. Before pushing, reload the current
persisted body/groups and skip an already superseded generation. That read is a
data/authorization snapshot, not a lock through external delivery: another commit
may follow the read before the push arrives. There is no end-to-end notification
ordering guarantee. Duplicate receipts do not resend historical payloads. A
post-commit crash/push failure can lose a push but does not repeat persistence.
Durable delivery would require a separate outbox/versioned invalidation contract.

Receipts retain only play ID, generation and creation time. They are permanent
so old retries cannot repeat an increment. Monitor growth; TTL/pruning requires
a separately enforced bounded retry/idempotency window. Back up/restore
`projection_control`, `projection_receipts` and views together. Resetting one
independently invalidates fencing or duplicate suppression.

## Verification

From the Toolbox root, use only a disposable local replica set:

```sh
TEST_MONGODB_URL='mongodb://127.0.0.1:PORT/test?replicaSet=NAME' \
  node node_modules/mocha/bin/mocha.js \
  packages/procedures/view_stores/mongodb/integration/projection_session.js
```

The suite creates/drops its own `blossm_audit_views_*` database. It checks source
and fact serialization, unknown commit outcome, rollback, takeover/in-flight
fencing, prepared activation races, ordered query operations, limits, persistent
legacy rejection, notifications, uniqueness and positional no-match behavior.
Without TEST_MONGODB_URL it skips; ordinary package tests remain offline.
