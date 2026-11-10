An event store server POST handler transaction.

`normalizeTransactionFn(tx)` is required. The transaction is normalized and
validated once before reserving counts; its returned representation is used for
both `headers.tHash` and persistence. Rejection prevents all counter/event writes.
