module.exports = ({
  store,
  query,
  sort = null,
  select = null,
  skip = 0,
  limit = null,
  options = null,
}) => {
  if (query) {
    console.log({ query: JSON.stringify(query) });
  }
  console.log({
    select: JSON.stringify({
      ...select,
      ...((!select ||
        !Object.keys(select).some((key) => select[key] === 1)) && {
        _id: 0,
        __v: 0,
      }),
    }),
  });
  if (sort) {
    console.log({
      sort: JSON.stringify(sort),
    });
  }
  return store.find(
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
};
