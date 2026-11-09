Compose Express procedure routes with the default server builder.

The named `write(res, value)` helper preserves Buffers/scalars, JSON-encodes
objects and arrays, and waits for response drain before resolving. Producers
must await this helper (or their injected streamFn). Disconnect/error while
waiting rejects and removes listeners; already closed responses reject.

`forwardHeaders(headers)` preserves end-to-end response metadata and repeated
cookies while removing upstream hop-by-hop fields, Connection-nominated fields
and Content-Length. The gateway owns its connection framing and final body size.
