module.exports = async ({ store, query, map, reduce, finalize, out }) => {
  return await store.mapReduce({
    map,
    reduce,
    out,
    ...(query && { query }),
    ...(finalize && { finalize })
  });
};
