export default ({ store, query, select = null, sort, options }) =>
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
    { ...(sort && { sort }), ...options }
  );
