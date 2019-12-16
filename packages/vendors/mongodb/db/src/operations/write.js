module.exports = async ({ store, query, update, options = {} }) => {
  //eslint-disable-next-line
  console.log("writting: ", { store, query, update, options });
  return await store.findOneAndUpdate(query, update, options);
};
