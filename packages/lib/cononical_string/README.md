# @blossm/cononical-string

Creates a stable JSON string independent of object property insertion order.
The existing misspelled package name is retained for compatibility.

```js
canonical(value); // Historical format 1, not safe for new Boolean commitments.
canonical(value, { canonicalFormat: 2 }); // Boolean-safe format 2.
```

Format 1 is pinned to canonical-json 0.2.0. It intentionally preserves historical
bytes, including the Boolean collision. Format 2 pins fast-json-stable-stringify 2.1.0. It preserves JSON Booleans and
own keys, lexically sorts object keys, and uses native JSON string escaping
(including lone UTF-16 surrogates). Golden vectors define the format; changing
the dependency requires verifying byte compatibility.
JSON omission/null rules apply to undefined values; cyclic values and BigInt
are unsupported. This is a JSON format, not an arbitrary JavaScript object codec.
Unknown format numbers throw rather than silently selecting a serializer.

## Event-store rollout

`createEvent` and new block/snapshot creation default to format 2 and persist
`headers.canonicalFormat: 2`. This marker is independent of the application's
`headers.version`. An absent marker means format 1 forever. Generic `hash` and
canonical-string defaults remain format 1 so old verification does not change.

Hash a persisted object's headers or data using its own marker:

```js
hash(event.payload, { canonicalFormat: event.headers.canonicalFormat }).create();
hash(event.headers, { canonicalFormat: event.headers.canonicalFormat }).create();
```

The same rule applies to snapshot component/header hashes and block header
hashes. Unversioned string hashing and Merkle keys remain unchanged; explicit format 2
hashes canonical JSON for every type, including quoted strings. Block leaf
encoding uses the block's format; a format 2 block preserves original Boolean
values even when exporting a format 1 event. The event's own marker still owns
verification of that event's commitments. Prior hashes in the chain are copied,
never recomputed. No historical rows, blocks, signatures or roots are rewritten.

This is a coordinated protocol rollout, not a drop-in patch release:

1. Inventory consumers/verifiers, queued requests and retry retention. Record the
   last legacy event/block boundaries per store. Back up data and test restored
   historical vectors against format 1. Old Boolean collisions cannot be repaired
   or used to prove which colliding value originally occurred.
2. Deploy these marker-aware readers and Mongo schemas everywhere first, while
   explicitly setting `canonicalFormat: 1` on command procedures, direct
   `createEvent` producers and event stores. CLI command/event-store configs pass
   this option through. Keep producers and stores on the same selection.
3. Quiesce writes and drain legacy queues/retries, then select format 2 on all
   producers and their stores. The new default is 2. A selected store rejects
   mismatched writers before idempotency checks or persistence. Do not run a
   mixed writer fleet against one store. Calls that bypass HTTP and use
   postTransaction directly must coordinate their producers themselves.
4. Resume writes and verify newly stored payload/context/group/transaction,
   snapshot and block commitments with their markers. Verify block exports retain
   Booleans in both public and encrypted payload/state paths. Monitor rejected
   stale producers before considering activation complete.

Format 2 event retry identities include a `v2:` prefix outside hex encoding. Legacy identities
contain only hex characters, so even caller-supplied legacy keys cannot alias
this namespace.
They are deliberately distinct from legacy retry identities, even for payloads
whose bytes did not change. A legacy operation retried as format 2 can therefore
be applied twice: draining retries or reconciling them at the application level
is required. This change does not introduce a bounded or confidential
idempotency digest; existing encoded identity structure is otherwise retained.

After format 2 activation, rollback may use marker-aware code only. Never roll
back to a version that drops the marker or serializes Booleans incorrectly.
Do not resume format 1 writes after activation. The block writer refuses a
format 1 block after a format 2 block or over pending format 2 events. Rollback
means reverting application changes while retaining format 2 protocol support. No
production activation, migration or deployment is performed by this PR.
