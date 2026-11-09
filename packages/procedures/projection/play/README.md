An projection server POST handler for playing a root.

A remote generated projection sessionFn wraps the play before any aggregate/fact read. The Mongo
view-store protocol uses it to buffer and atomically commit an ordered batch.
Session mode requires a stable delivery ID: Pub/Sub subscription/messageId or
playId from queued/direct RPC. Local mode omits sessionFn and retains direct infrastructure behavior.
