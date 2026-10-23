# Event-store POST handler

Numbered writes are strict conditional appends: they must satisfy the requested
event number on every submission. They always reach the existing transaction's
number check, including when their idempotency key has already been stored or
appears earlier in the batch.

Unnumbered writes retain duplicate-success behavior. Already stored events and
later copies in the same batch are skipped. Input order is preserved after the
parallel conflict lookups.

This intentionally changes retries of already-applied numbered writes from
successful no-ops to precondition failures. A failure after a lost response can
mean the earlier write committed; callers must read/reconcile state rather than
assume nothing happened. This provides strict append admission, not atomic work
across different stores or recovery of post-write callbacks.
