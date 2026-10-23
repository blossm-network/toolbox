Redis cache interactions.

`writeObject(key, object)` stores Redis hash fields, `readObject(key)` reads them,
and `setExpiry(key, { seconds })` sets their TTL. Values must use Redis-compatible
string/number/Buffer field representations; serialize dates explicitly.

Without a ready Redis client, the same API uses a process-local cache with TTL
checks on access. It is not shared between instances, and entries written during
an outage are not copied into Redis when it becomes ready. Callers must set an
expiry for bounded permission/token caching. Remote writes and setExpiry remain
two operations, so a process stopping between them can leave an unexpired hash.
