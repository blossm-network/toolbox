Calls an internal procedure or external gateway through the fluent RPC API.

Reads and streams copy their query input rather than removing its id. Internal
requests forward trusted context/claims/currentToken, while external requests
use the network token and gateway boundary.

Streams decode concatenated JSON objects/arrays using the request package's
shared stateful UTF-8 decoder. Use `{raw:true}` for binary/scalar byte streams.
Stream options also accept onResponseFn, signal and network timeout; response
metadata arrives before data. Callbacks are awaited, transport HTTP failures
reject before callbacks and a truncated JSON stream rejects at completion.

`with({ includeDelivery: true })` adds `delivery: "queued"` after actual queue
acceptance, or `delivery: "completed"` after an HTTP response. Completed delivery
means HTTP completion, not database commitment. When local mode bypasses a queue,
this option preserves the actual HTTP response body instead of the legacy empty
object. Without the option, existing response behavior is unchanged. Errors
propagate, and a missing response is not reported as completed delivery.

Import `COMPLETED` and `QUEUED` from `@blossm/rpc-delivery-consts` for delivery
comparisons. Event outcome constants are a separate contract.

Transport deadlines and cancellation can be passed with
`with({ timeout: 120000, signal })`. These options go to the HTTP transport,
including single-source streams, and are never serialized into request data or
queued operations. Omitting them uses the request package's defaults. The
specialized RPC adapters do not currently expose these options through their
own APIs; this option is available on the generic RPC builder.

These transport deadlines do not cover token acquisition or queued operation
execution. They apply when the HTTP transport starts.

Structured `stream(fn, query)` calls deliver complete JSON object/array records,
independent of HTTP chunk boundaries. Each HTTP execution owns its decoder,
including retries or concurrent `.with()` calls on the same builder. Invalid
UTF-8, malformed JSON and unfinished records reject the call. Pass
`stream(fn, query, { raw: true })` for arbitrary text or binary byte chunks.
