A mongodb event store server function to get snapshots.

Candidate queries preserve scalar types through the existing Mongo aggregate
operation, without Mongoose query casting. `limit` defaults to 100; explicit
`limit: null` returns all matches. Optional `select` projects candidate metadata
without loading snapshot state or event buffers.
