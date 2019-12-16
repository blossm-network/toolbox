module.exports = async ({ store, query, update, options = {} }) => {
  return await store.findOneAndUpdate(query, update, options);
};
