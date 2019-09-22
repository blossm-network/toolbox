module.exports = async ({ store, query, update, options = {} }) => {
  return await store.updateMany(query, update, options);
};
