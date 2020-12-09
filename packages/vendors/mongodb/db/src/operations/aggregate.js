module.exports = ({
  store,
  query,
  sort = null,
  select = null,
  skip = 0,
  limit = null,
}) => {
  //TODO
  console.log({ dbQuery: JSON.stringify(query) });
  return store.aggregate([
    { $match: query },
    {
      $project: {
        ...select,
        ...((!select ||
          !Object.keys(select).some((key) => select[key] === 1)) && {
          _id: 0,
          __v: 0,
        }),
      },
    },
    ...(sort ? [{ $sort: sort }] : []),
    ...(skip ? [{ $skip: skip }] : []),
    ...(limit ? [{ $limit: limit }] : []),
  ]);
};
