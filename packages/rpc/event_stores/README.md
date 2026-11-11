Stream aggregates from several event stores through their existing
`/stream-aggregates` endpoint:

```js
eventStores({
  storeQueries: [{ domain: "account", service: "core", query: { root: "root" } }],
}).stream(async (aggregate) => { /* consume aggregate */ }, compareAggregates);
```

`service` defaults to SERVICE, `query` defaults to an empty object and accepts the
single-store aggregate-stream query fields. Set context/claims and an internal
token producer through `.set(...)`. This wrapper targets internal event stores;
cross-network addressing belongs to the lower-level stream RPC builder.
Records are decoded independently per source before merging. Each input must
already be ordered according to the comparator; this does not sort a whole
unordered aggregate scan. Callbacks are awaited and failures cancel all sources.

Full aggregate scans do not guarantee order by arbitrary aggregate fields; omit
the comparator when consuming those scans. A `query.root` for each source, as
in the example, returns at most one aggregate per input and supports comparison
across those results. This API does not request a server-side global sort.
