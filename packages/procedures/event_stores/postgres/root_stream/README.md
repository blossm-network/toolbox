A postgres event store server function to stream all roots, or with `unsnapshottedOnly` only roots whose latest snapshot does not cover every event. The coverage filter runs in SQL before the limit.
