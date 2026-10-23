Calls an operation on a service within the network.

`with({ includeDelivery: true })` adds `delivery: "queued"` after actual queue
acceptance, or `delivery: "completed"` after an HTTP response. Completed delivery
means HTTP completion, not database commitment. When local mode bypasses a queue,
this option preserves the actual HTTP response body instead of the legacy empty
object. Without the option, existing response behavior is unchanged. Errors
propagate, and a missing response is not reported as completed delivery.

Import `COMPLETED` and `QUEUED` from `@blossm/rpc-delivery-consts` for delivery
comparisons. Event outcome constants are a separate contract.
