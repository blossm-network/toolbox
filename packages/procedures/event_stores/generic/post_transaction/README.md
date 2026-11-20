An event store server POST handler transaction.

`normalizeTransactionFn(tx)` is required. The transaction is normalized and
validated once before reserving counts; its returned representation is used for
both `headers.tHash` and persistence. Rejection prevents all counter/event writes.

`normalizePayloadFn(payload)` is optional and defaults to identity. When an
adapter supplies it, every event payload (an absent one as `{}`) is normalized
before counts are reserved. The returned value is the one committed by
`headers.pHash` and passed to `saveEventsFn`; the adapter must persist it
unchanged. Rejection prevents all counter/event writes.

The append function reruns in full when the adapter's transaction driver retries
a known abort, so the normalizer is called again for every payload. It must be
deterministic and free of external side effects: the same payload always yields
the same result or the same rejection. Each call receives its own copy of the
JSON payload, so mutating the argument cannot change the submitted event or a
later attempt. Payloads are JSON; no other value types are supported. Without a
normalizer the submitted payload object is hashed and passed on as is.
