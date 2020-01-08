module.exports = ({ store, query, select = null, options = null }) =>
  store.findOne(query, { ...select, _id: 0, __v: 0 }, options);
