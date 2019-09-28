module.exports = async ({ store, query, select = null, options = null }) => {
  return await store.findOne(query, select, options);
};
