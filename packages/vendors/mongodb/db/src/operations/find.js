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
    { ...select, _id: 0, __v: 0 },
    {
      ...(skip && { skip }),
      ...(sort && { sort }),
      ...(limit && { limit }),
      ...options,
    }
  );
