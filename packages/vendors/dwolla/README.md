Dwolla payment functionality.

Pass an explicit `environment` (`sandbox` or `production`) when composing the
client. The upstream SDK defaults to production when it is omitted.

All customer creation methods return the created resource's Location URL,
including `createReceiveOnly`. Successful creation can have an empty body.
Supply an `idempotencyKey` when an operation may be retried. Unexpected SDK,
transport, rate-limit and server errors propagate to the caller for recovery;
this adapter does not retry external writes automatically.
