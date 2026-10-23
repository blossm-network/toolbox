HTTP access through Node's native fetch, with the existing `post`, `put`, `del`,
`get`, `stream` and `streamMany` interface. No Request or merge-stream dependency.

JSON writes accept `body`; their response bodies are parsed when valid JSON.
GET/DELETE and multipart responses retain text bodies. Every ordinary response
has `headers`, `statusCode`, `statusMessage` and `body`, including HTTP errors.
`formData` accepts scalar fields, Buffers, Blobs and `{value, options}` fields
with `filename` and `contentType`. File streams use native file-backed Blobs;
other multipart streams are buffered with cancellation. File-stream byte ranges
and existing descriptors are respected. Use one of `body` and `formData`.

All methods accept `signal` and `timeout` in milliseconds, default 30 seconds per
multipart-preparation phase, upload/response-header wait, and response-chunk wait.
Upload progress does not reset the upload/headers deadline. Streams await each
callback before reading again,
reject HTTP errors before callbacks, abort on callback failure/cancellation and
optionally call `onResponseFn({headers,statusCode,statusMessage})` before data.
A slow callback does not consume the network idle timeout. Callers own retries;
mutating requests are never retried automatically.

GET redirects follow at most five hops. Authorization, Cookie and
Proxy-Authorization are stripped when origin changes; HTTPS downgrade redirects
are rejected. Writes return redirect responses without following them.

`streamMany(requests, fn, sortFn, options)` merges sorted input streams using
one lookahead value per source and one awaited output callback. Inputs must
already be sorted according to `sortFn`; it cannot sort arbitrary whole streams.
An empty request list completes without callbacks. Failure cancels all sources.
The optional `decode` factory returns a per-source `{write,end}` decoder so
framed records can be decoded before comparing/merging, without sharing parser
state between sources. Without a decoder, values remain raw byte chunks.

`jsonDecoder()` is the shared concatenated-JSON object/array decoder used by RPC.
Each source gets its own decoder. It retains partial records, UTF-8 bytes,
quoted strings and escapes across chunks, and rejects a truncated final record.
Binary or scalar streams should use the RPC `raw` option. A decoder buffers its
current record; it does not load an entire multi-record stream.
