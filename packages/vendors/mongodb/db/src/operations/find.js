module.exports = async ({
  store,
  query,
  sort = null,
  select = null,
  skip = 0,
  pageSize = null,
  options = null
}) => {
  return await store.find(query, select, {
    ...(skip && { skip }),
    ...(sort && { sort }),
    ...(pageSize && { limit: pageSize }),
    ...options
  });
};
