Delivers persisted event notifications through the shared pending-delivery loop.

Delivery is at least once. Each call reads one bounded batch ordered by failed
attempts, commit time and hash, publishes each notice, and deletes a notice only
after its publish function resolves. A rejected publish, or a failed delete,
leaves the notice stored, counts an attempt when that update succeeds, and the
call rejects with the first failure after trying the rest of the batch. A
notice whose delete is lost after a successful publish is published again, and
publishers running concurrently can publish the same notice, so subscribers
must be idempotent. There is no attempt limit or dead-letter store.

The native checks live in the save-events package's `test:integration` suite.
