An event store server.

## Durable publication recovery

Outside local mode, event writes also insert pending notices into the
`publications` collection within the same MongoDB transaction. Unique event
hashes identify notices. Event persistence rejects an enabled outbox without a
transaction. An aborted batch leaves neither events nor notices.

On startup, the server attempts one pending-publication batch before listening.
This recovers notices left by a previous process without waiting for an event or
block request. If publication fails, it logs the failure and still starts; notices
remain available for subsequent recovery. This is one bounded attempt, not a
drain-until-empty loop or a background retry worker.

After commit, POST dispatches up to `publicationBatchSize` pending notices
(default 100), including on an
idempotent retry containing no new events. Scheduled `/create-block` calls also
dispatch pending notices after their block commits, including genesis and empty
blocks. Generated deployments already schedule that route. Direct compositions
must retain that recurring invocation for recovery after a process exits before
dispatch. There is no autonomous background worker in this package.

A notice is removed only after the publisher acknowledges it. Failed notices
remain durable and their attempt counter advances, so an older failing batch
does not indefinitely hide unattempted notices. One failed topic does not prevent
attempting the remainder of the selected batch. The query and work per invocation
are bounded to the configured batch size; backlog throughput depends on POST and block-call
frequency and must be monitored operationally.

Delivery is at least once. A process may stop after acknowledgement but before
removal, or concurrent servers may publish the same notice. Subscribers must
handle duplicates, as they already must with Pub/Sub. No lease or claim mechanism
promises exactly-once external effects.

Once an event or block transaction commits, publication recovery is best effort:
failures are logged and notices remain pending, while the committed request
returns its successful result. Transaction failures still fail the request.
Startup, POST and block routes share this failure policy. Each published notice
includes the stable event `hash`, allowing subscribers to deduplicate retries.

This protects future writes. It does not reconstruct historical missing notices
or replay old side effects automatically. Audit existing read-model freshness
and choose any historical repair separately. Local mode retains its existing
nontransactional/no-publication behavior and does not create the outbox. Every non-local adapter must provide durable publication. The generic server
rejects a missing `publishPendingFn` before constructing routes or listening;
there is no direct-publication fallback. Mongo supplies its dispatcher through
`@blossm/mongodb-event-store-publish-pending`, a sibling operation package.

## Publication batch size

Set `publicationBatchSize` in server composition to tune work per recovery call:

```js
mongodbEventStore({
  schema,
  handlers,
  secretFn,
  publishFn,
  publicationBatchSize: 50,
});
```

The default is 100. The value must be a positive safe integer; invalid values
fail while composing the dispatcher. Each invocation processes one batch.
Acknowledged notices are removed, failed attempts rotate, and the next invocation
queries remaining work. No cursor or offset is needed. Larger batches increase
potential throughput and request work; this does not establish a time budget.
Local mode retains its existing publication bypass.

## Tests

`npm test` runs the package's ordinary Mocha tests without MongoDB.

The Mocha suites in `test/integration/` verify transaction rollback, duplicate
retry recovery, redelivery and actual unique-index creation against MongoDB.
They call the composed procedures directly; they do not start HTTP or contact
Pub/Sub. Publication failures are injected through the existing dependency seam.

Start a disposable localhost MongoDB replica set, then run from this package:

```sh
BLOSSM_TEST_MONGODB_URI='mongodb://127.0.0.1:27017/?replicaSet=test' npm run test:integration
```

Or run from the Toolbox root through Lerna:

```sh
BLOSSM_TEST_MONGODB_URI='mongodb://127.0.0.1:27017/?replicaSet=test' ./node_modules/.bin/lerna run test:integration --scope @blossm/mongodb-event-store --npm-client npm --stream
```

Each suite creates and drops its own temporary database. Shared Mocha hooks
restore environment, dependency replacements and cached models after the suite.
The integration command requires the explicit URI and fails when it is missing;
the regular test command never connects to MongoDB.
