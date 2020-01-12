module.exports = async ({ store, data, options = {} }) => {
  return await store.create(data, options);
};
