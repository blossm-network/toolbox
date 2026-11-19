An event store server POST handler transaction.

`normalizeTransactionFn(tx)` is required. The transaction is normalized and
validated once before reserving counts; its returned representation is used for
both `headers.tHash` and persistence. Rejection prevents all counter/event writes.

`normalizePayloadFn(payload)` is optional and defaults to identity. When an
adapter supplies it, every event payload (an absent one as `{}`) is normalized
before counts are reserved. The returned value is the one committed by
`headers.pHash` and passed to `saveEventsFn`; the adapter must persist it
unchanged. Rejection prevents all counter/event writes.
