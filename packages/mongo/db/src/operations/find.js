module.exports = async ({
  store,
  query,
  sort = null,
  select = null,
  skip = 0,
  pageSize = null
}) => {
  const operation = store.find(query).skip(skip);

  if (sort != undefined) operation.sort(sort);
  if (select != undefined) operation.select(select);
  if (pageSize != undefined) operation.limit(pageSize);

  return await operation.exec();
};
