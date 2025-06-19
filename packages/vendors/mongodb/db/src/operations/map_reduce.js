export default async ({
  store,
  query,
  sort,
  limit,
  map,
  reduce,
  finalize,
  out,
}) =>
  await store.mapReduce({
    map,
    reduce,
    out,
    resolveToObject: true,
    ...(query && { query }),
    ...(limit && { limit }),
    ...(sort && { sort }),
    ...(finalize && { finalize }),
  });
