An projection server POST handler for playing a root.

A remote generated projection sessionFn wraps the play before any aggregate/fact read. The Mongo
view-store protocol uses it to buffer and atomically commit an ordered batch.
Pub/Sub sessions require the stable event hash and subscription scope. Receipt
IDs use their JSON tuple, so republication under a new messageId cannot repeat
mutations. Queued/direct RPC retains its explicit playId. Local mode omits sessionFn and retains direct infrastructure behavior.
