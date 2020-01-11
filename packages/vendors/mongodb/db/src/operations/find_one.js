module.exports = ({ store, query, select = null, sort }) =>
  store.findOne(
    query,
    { ...select, _id: 0, __v: 0 },
    { ...(sort && { sort }) }
  );
