module.exports = async ({ store, data, options = {} }) => {
  return await store.insertMany(
    [...(data instanceof Array ? data : [data])],
    options
  );
};
