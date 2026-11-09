Interact with a view store.

The internal projectionSession method sends synchronous begin/renew/commit/release
and notification requests to the destination's /projection-session endpoint. It
does not enqueue view writes. Generated remote projections use the route for
cooperating-play consistency; direct update/delete remain independent operations.
