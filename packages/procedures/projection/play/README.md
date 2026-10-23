An projection server POST handler for playing a root.

An optional sessionFn wraps the play before any aggregate/fact read. The Mongo
view-store protocol uses it to buffer and atomically commit an ordered batch.
Session mode requires a stable delivery ID: Pub/Sub subscription/messageId or
playId from queued/direct RPC. Without sessionFn, legacy behavior is unchanged.
