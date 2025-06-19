export default async ({ store, query, update, options = {} }) =>
  await store.findOneAndUpdate(query, update, options);
