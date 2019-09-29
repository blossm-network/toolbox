module.exports = async ({ store, query, map, reduce, finalize, out }) => {
  return await store.mapReduce({
    map,
    reduce,
    out,
    resolveToObject: true,
    ...(query && { query }),
    ...(finalize && { finalize })
  });
};
