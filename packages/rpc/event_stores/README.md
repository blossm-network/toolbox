Stream aggregates from several event stores through their existing
`/stream-aggregates` endpoint:

```js
eventStores({
  storeQueries: [{ domain: "account", service: "core", query: { root: "root" } }],
}).stream(async (aggregate) => { /* consume aggregate */ }, compareAggregates);
```

`service` defaults to SERVICE, `query` defaults to an empty object and accepts the
single-store aggregate-stream query fields. Set context/claims and internal or
external token producers through `.set(...)` as with the other RPC clients.
Records are decoded independently per source before merging. Each input must
already be ordered according to the comparator; this does not sort a whole
unordered aggregate scan. Callbacks are awaited and failures cancel all sources.
