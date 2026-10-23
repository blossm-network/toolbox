Access to an event store.

`add({ eventData, tx, returnOutcomes: true })` requests input-ordered write
outcomes from the store and delivery metadata from generic RPC. Synchronous
responses can include `body.outcomes` containing `committed`/`duplicate` statuses;
actual queue acceptance returns `delivery: "queued"`. A store still returning
204 has unknown write outcomes, regardless of HTTP completion. Local queue
bypass preserves the real HTTP result with this option. Omitting the option
retains the previous API behavior.
