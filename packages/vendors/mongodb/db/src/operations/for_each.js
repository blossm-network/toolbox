export default async ({ store, query, fn }) =>
  await store.find(query).cursor().eachAsync(fn, { parallel: 1 });
