Verifies a message signature with the public key returned by a configured URL.

The response body must contain `{ "key": "<PEM public key>" }`. Keys are cached
by URL for five minutes by default. `cacheMilliseconds` overrides that lifetime;
zero fetches on every verification. The shared cache retains at most 100 URLs.
An expired key is refreshed before verification, and a failed refresh propagates
its error instead of accepting a stale key. Concurrent cold calls may fetch more
than once. A key rotation must account for the configured cache lifetime and the
lifetimes of tokens signed by the old key. This helper does not implement a
multi-key JWKS rollover protocol.
