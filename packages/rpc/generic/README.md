Calls an internal procedure or external gateway through the fluent RPC API.

Reads and streams copy their query input rather than removing its id. Internal
requests forward trusted context/claims/currentToken, while external requests
use the network token and gateway boundary.

Streams decode concatenated JSON objects/arrays using the request package's
shared stateful UTF-8 decoder. Use `{raw:true}` for binary/scalar byte streams.
Stream options also accept onResponseFn, signal and network timeout; response
metadata arrives before data. Callbacks are awaited, transport HTTP failures
reject before callbacks and a truncated JSON stream rejects at completion.
