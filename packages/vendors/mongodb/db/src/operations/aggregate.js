module.exports = ({
  store,
  query,
  sort = null,
  select = null,
  skip = 0,
  limit = null,
}) => {
  console.log({ sort });
  console.log({ query });
  console.log({ select });
  return store.aggregate([
    { $match: query },
    ...(sort ? [{ $sort: sort }] : []),
    {
      $project: {
        ...select,
        ...((!select ||
          !Object.keys(select).some((key) => select[key] === 1)) &&
          {
            // _id: 0,
            // __v: 0,
          }),
      },
    },
    ...(skip ? [{ $skip: skip }] : []),
    ...(limit ? [{ $limit: limit }] : []),
  ]);
};
