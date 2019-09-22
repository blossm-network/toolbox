module.exports = async ({ store, query, select }) => {
  const operation = store.findOne(query);

  if (select != undefined) operation.select(select);

  return await operation.exec();
};
