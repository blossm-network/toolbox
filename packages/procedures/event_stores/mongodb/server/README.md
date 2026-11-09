An event store server.

## Durable publication recovery

Outside local mode, event writes also insert pending notices into the
`publications` collection within the same MongoDB transaction. Unique event
hashes identify notices. Event persistence rejects an enabled outbox without a
transaction. An aborted batch leaves neither events nor notices.

After commit, POST dispatches up to 100 pending notices, including on an
idempotent retry containing no new events. Scheduled `/create-block` calls also
dispatch pending notices after their block commits, including genesis and empty
blocks. Generated deployments already schedule that route. Direct compositions
must retain that recurring invocation for recovery after a process exits before
dispatch. There is no autonomous background worker in this package.

A notice is removed only after the publisher acknowledges it. Failed notices
remain durable and their attempt counter advances, so an older failing batch
does not indefinitely hide unattempted notices. One failed topic does not prevent
attempting the remainder of the selected batch. The query and work per invocation
are bounded to 100 notices; backlog throughput depends on POST and block-call
frequency and must be monitored operationally.

Delivery is at least once. A process may stop after acknowledgement but before
removal, or concurrent servers may publish the same notice. Subscribers must
handle duplicates, as they already must with Pub/Sub. No lease or claim mechanism
promises exactly-once external effects.

A dispatch error still fails the HTTP request after the event or block has
committed, preserving the existing response contract. A failed response does not
prove rollback. Retry event requests with the same idempotency keys; Mongo event
schemas require them. The next POST or scheduled block invocation also retries
pending delivery.

This protects future writes. It does not reconstruct historical missing notices
or replay old side effects automatically. Audit existing read-model freshness
and choose any historical repair separately. Local mode retains its existing
nontransactional/no-publication behavior and does not create the outbox. Other
adapters retain the generic direct-publication path unless they implement the
optional `publishPendingFn` hook with equivalent durable persistence.

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
