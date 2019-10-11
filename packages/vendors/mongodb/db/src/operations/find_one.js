module.exports = ({ store, query, select = null, options = null }) =>
  store.findOne(query, select, options);
