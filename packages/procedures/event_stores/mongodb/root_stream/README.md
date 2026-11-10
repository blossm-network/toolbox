A mongodb event store server function to stream all roots.

`unsnapshottedOnly: true` requires `snapshotStore` at composition and streams
counts whose value exceeds the latest snapshot's zero-based lastEventNumber + 1.
Roots with events and no snapshot are included. Latest means headers.created
descending, matching the aggregate reader. The metadata lookup uses the existing
snapshot root/created index; it may still visit all count records. Ordinary root
streams retain their existing behavior and do not require snapshotStore.
