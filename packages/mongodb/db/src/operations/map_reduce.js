module.exports = async ({ store, query, mapFn, reduceFn, finalizeFn, out }) => {
  return await store.mapReduce(mapFn, reduceFn, {
    query,
    out,
    finalize: finalizeFn
  });
};
