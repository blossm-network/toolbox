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

## Durable application actions

A trusted server composition can prepare and deliver actions in addition to
notifications:

```js
mongodbEventStore({
  schema,
  handlers,
  secretFn,
  publishFn,
  actionsFn: prepareActions,
  deliverActionFn: deliverAuthorizedAction,
});
```

`actionsFn(event)` returns an array of JSON-transportable intent objects, or `[]`.
It runs for newly inserted normalized events inside the event transaction. It
must be deterministic, must not mutate the event, and must not perform external
work. The complete intent is encoded once with native JSON serialization and
stored as wire text, alongside its hash, in the `actions` collection. Failed
preparation or insertion aborts the event and its notices too. Configured actions
require both hooks and real transactions; local mode rejects that configuration.

Each pending record has `id`, `eventHash`, `intentHash`, `intent`, `created` and
`attempts`. Its stable ID is the committed event hash plus the action's array
position. Position identifies the action; it does not promise execution order
or dependencies between actions. `intent` is JSON text, not an object. Hashing these exact bytes through
the existing hash owner avoids legacy object-serialization ambiguities without
changing historical event hashes. Receivers verify the hash of the string before
calling `JSON.parse`; object-key equivalence or reserialization is not promised.

`deliverActionFn(record)` must return `{ id, intentHash }` only after the receiver
commits the business effect and its retained receipt in one transaction, or reads
an existing matching receipt. Reusing the ID with a different intent hash must
fail at the receiver. Retain receipts for the entire retry/replay window; expiring
them while a pending action can still redeliver permits repeated effects.
The dispatcher removes pending work only when both returned
fields match. Missing, mismatched or queue-only acknowledgments keep it pending.
Matching fields validate identity, not receiver honesty: this hook must use a
trusted adapter that honors the durable-receipt contract.

The shared pending-delivery loop handles up to 100 entries per collection,
rotates failures through its attempt count and permits duplicate delivery after
lost acknowledgments or overlapping dispatchers. Publication and action queues
are drained independently, so a failed notification does not prevent an action
attempt. POST retries and recurring block calls drive both queues, including when
no new event was written. Recovery still needs those recurring calls; there is no
new autonomous scheduler or cross-store transaction.

Preparation and delivery are server-configured functions. The HTTP event API does
not accept executable action metadata. The adapter owns permitted destinations,
execution authority, revocation policy and receiver idempotency. Do not persist
raw tokens, codes or unrestricted credentials in intents. These hooks are not
wired automatically into generated CLI applications in this proposal.

Dia's current session upgrade does not yet implement this receiver contract.
Its integration and authenticated recovery of session/token responses remain
separate work. An ordinary successful command response is not a durable action
receipt, and this change does not make arbitrary thenFn callbacks recoverable.

### Action verification

The same `npm run test:integration` command runs the action suite alongside
publication recovery and startup-index checks.

The action fixture uses the real server, producer and dispatcher plus a receiver
that commits its receipt and effect together. It covers rollback, duplicate
producer requests, scheduled recovery, lost delete acknowledgments, overlapping
drainers, changed intent rejection, invalid receipts and independent action
progress. Fixtures explicitly wait for model index initialization; they do not
establish that the separate server-readiness audit fix has been adopted. Network
receiver behavior, Dia adoption, process-kill recovery and failover are not proven.
