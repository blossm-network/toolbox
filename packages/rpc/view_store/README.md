Interact with a view store.

The internal projectionSession method sends synchronous begin/renew/commit/release
and notification requests to the destination's /projection-session endpoint. It
does not enqueue view writes. Enable it only after the destination's explicit
prepared/fenced migration; its store guide owns bounds and recovery semantics.
