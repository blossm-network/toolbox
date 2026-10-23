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

## Local replica-set verification

Use a temporary localhost MongoDB replica set, never production. Each script
creates a uniquely named database and drops it in `finally`:

```sh
BLOSSM_TEST_MONGODB_URI='mongodb://127.0.0.1:27017/?replicaSet=test' node integration/publications.js
```

Run from this package directory. The checks exercise durable publication
rollback, idempotent retry and duplicate delivery through server composition.

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

With an isolated localhost replica set:

```sh
BLOSSM_TEST_MONGODB_URI='mongodb://127.0.0.1:27017/?replicaSet=test' node integration/actions.js
BLOSSM_TEST_MONGODB_URI='mongodb://127.0.0.1:27017/?replicaSet=test' node integration/startup.js
```

The action fixture uses the real server, producer and dispatcher plus a receiver
that commits its receipt and effect together. It covers rollback, duplicate
producer requests, scheduled recovery, lost delete acknowledgments, overlapping
drainers, changed intent rejection, invalid receipts and independent action
progress. Fixtures explicitly wait for model index initialization; they do not
establish that the separate server-readiness audit fix has been adopted. Network
receiver behavior, Dia adoption, process-kill recovery and failover are not proven.
