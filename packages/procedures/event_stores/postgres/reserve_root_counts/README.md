A postgres event store server function that allocates event numbers.

One atomic upsert adds `amount` to the root's count and returns the new total;
the caller owns numbers `value - amount` up to `value - 1`. Concurrent calls
never receive overlapping ranges. Given a transaction, the reservation commits
or rolls back with it. Inside the vendor's repeatable-read transaction a
concurrent reservation for the same root fails with `40001`, which the vendor
retries a bounded number of times before surfacing it.

The native checks live in the save-events package's `test:integration` suite.
