Stream one or many remote procedures with ordinary RPC identity/addressing.
Provide `operationNameComponentQueries: [{operationNameComponents, query}]`, an
awaited `fn` and an optional `sortFn`; then use `.in(...).with(...)` as with RPC.

Each HTTP source has its own shared request JSON decoder, including partial
UTF-8/quoted/nested records. Decode precedes sorting so records from different
sources never share a framing buffer. Inputs must already be sorted according
to sortFn. The merge retains one lookahead value per source; empty input completes
without callbacks. Missing token producers are permitted for local/custom
transport use. HTTP failures, cancellation and callback errors reject and abort
all sources. `.with` also accepts `signal` and network-idle `timeout`.
