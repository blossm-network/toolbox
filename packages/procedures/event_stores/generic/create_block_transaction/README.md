An event store POST handler transaction for creating a block.

Blocks scan count/snapshot metadata for roots whose committed event count exceeds
their latest snapshot's `headers.lastEventNumber` plus one, then replay only those
pending roots. Counts are lengths and event numbers start at zero. Snapshot
sequence number is the primary selection order, with creation time secondary.
A late commit remains eligible even when its timestamp predates a committed
block. No persisted history or existing hashes are rewritten.

Block `start`/`end` remain signed metadata; `end` records the build timestamp,
not a count-root timestamp or an inclusion watermark. Candidate discovery scans
O(number of roots) metadata per block; unchanged roots are not replayed. A
durable pending-root queue is a future optimization if that cost becomes
material, not a substitute wall-clock filter.

When a transaction is supplied, predecessor, candidate-root, snapshot and event
reads use the same transaction as the block/snapshot writes. Same-session root
callbacks run serially. Failed blocks cannot advance durable snapshot progress.
Local mode retains its transaction/infrastructure bypass; it does not have the
remote transaction's atomicity or concurrent-builder guarantees.

The Mongo replica-set regressions use the existing server package's Mocha
integration runner and lifecycle. From the repository root:

```sh
BLOSSM_TEST_MONGODB_URI='mongodb://127.0.0.1:58532/?replicaSet=blossm-events' node node_modules/mocha/bin/mocha.js 'packages/procedures/event_stores/mongodb/server/test/integration/*.js' --timeout 30000
```

The frontier suite checks a held commit across an empty block, exact inclusion,
rollback/retry, forced concurrent predecessor reads and snapshot clock reversal.
It also verifies that unchanged roots do not reach event replay. Shared setup
rejects non-localhost databases, isolates suites and drops their databases.
