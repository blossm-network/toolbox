An event store POST handler transaction for creating a block.

Blocks enumerate every persisted count root and replay events after that root's
latest durable snapshot `headers.lastEventNumber`. Snapshot sequence number is
the primary selection order, with creation time as a secondary order. A late
commit remains eligible even when its application timestamp predates an already
committed block. No persisted history or existing hashes are rewritten.

Block `start`/`end` remain signed metadata; `end` records the build timestamp,
not a count-root timestamp or a correctness watermark. Root scans cost O(number
of roots) per block. A durable pending-root queue is a future optimization if
that cost becomes material, not a substitute wall-clock filter.

When a transaction is supplied, latest-block, root, snapshot and event reads use
the same transaction as the block/snapshot writes. Same-session root callbacks
run serially. Failed blocks cannot advance the durable snapshot frontier.

The Mongo replica-set regression is opt-in, uses a fresh randomly named database
and drops it afterward. From the repository root:

```sh
BLOSSM_MONGO_TEST_URI='mongodb://127.0.0.1:58472/blossm_audit_events?replicaSet=blossm-audit' node packages/procedures/event_stores/mongodb/server/integration/frontier.js
```

It checks a held event commit across an empty block, exact event inclusion,
snapshot rollback/retry, two contending builders and snapshot clock reversal.
The script rejects non-localhost endpoints.
