module.exports = ({
  store,
  query,
  sort = null,
  select = null,
  skip = 0,
  limit = null,
  options = null,
}) =>
  store.find(
    query,
    {
      ...select,
      ...((!select ||
        !Object.keys(select).some((key) => select[key] === 1)) && {
        _id: 0,
        __v: 0,
      }),
    },
    {
      ...(skip && { skip }),
      ...(sort && { sort }),
      ...(limit && { limit }),
      ...options,
    }
  );
