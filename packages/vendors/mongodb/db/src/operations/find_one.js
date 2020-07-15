module.exports = ({ store, query, select = null, sort }) =>
  store.findOne(
    query,
    {
      ...select,
      ...((!select ||
        !Object.keys(select).some((key) => select[key] === 1)) && {
        _id: 0,
        __v: 0,
      }),
    },
    { ...(sort && { sort }) }
  );
