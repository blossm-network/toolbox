module.exports = async ({ store, query, update, options = {} }) =>
  await store.updateMany(query, update, options);
