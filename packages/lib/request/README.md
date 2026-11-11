HTTP access through Node's native fetch, with the existing `post`, `put`, `del`,
`get`, `stream` and `streamMany` interface. No Request or merge-stream dependency.

JSON writes accept `body`; their response bodies are parsed when valid JSON.
GET/DELETE and multipart responses retain text bodies. Every ordinary response
has `headers`, `statusCode`, `statusMessage` and `body`, including HTTP errors.
Repeated Set-Cookie headers remain an array. Native fetch decodes supported
compression, so metadata removes the stale Content-Encoding/Content-Length for
those decoded representations.
`formData` accepts scalar fields, Buffers, Blobs and `{value, options}` fields
with `filename` and `contentType`. Unopened path-backed file streams use native
file-backed Blobs; already-open, descriptor-backed and other multipart streams
are buffered with cancellation. Multipart buffering has no byte limit. For large
files, pass a file-backed Blob from `node:fs`'s `openAsBlob` to avoid buffering.
File-stream byte ranges
and existing descriptors are respected. Passing formData hands its Node input
streams to the adapter: they are consumed during preparation or destroyed on
failure/cancellation, including a signal that was already aborted. Successfully
consumed streams with autoClose:false retain caller ownership of their descriptor. Use one of `body` and `formData`.

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

`jsonDecoder()` creates independent UTF-8 framing state for consecutive JSON
objects/arrays. Feed chunks with `write(chunk)` and flush with `end()`. Quoted
braces, nesting, escapes and byte-split code points are retained. Invalid UTF-8
bytes, malformed JSON, non-JSON separators and truncated final records reject
the stream. Direct string chunks retain their UTF-16 characters across splits.
The decoder buffers an incomplete record without a byte cap. Raw HTTP streams
are not implicitly parsed; generic RPC explicitly opts in, with independent
state for every HTTP execution, including retries and concurrent executions.
