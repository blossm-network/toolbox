Calls one or many remote stream procedure within the network.

`with({ timeout: 120000, signal })` passes the deadline and cancellation signal to
the merged HTTP transport. These options are not added to source queries.
Omitting them uses the request package's defaults. Specialized RPC adapters do
not currently expose these options through their own APIs.

These transport deadlines do not cover token acquisition or queued operation
execution. They apply when the HTTP transport starts.
