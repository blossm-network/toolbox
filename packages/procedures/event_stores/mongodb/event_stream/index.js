import deps from "./deps.js";

export default ({ eventStore }) => async ({
  parallel = 1,
  transaction,
  query,
  sort,
  limit,
  fn,
}) => {
  const cursor = deps.db
    .find({
      store: eventStore,
      query,
      ...(sort && { sort }),
      ...(limit && { limit }),
      options: { lean: true, ...(transaction && { session: transaction }) },
    })
    .cursor();

  return await cursor.eachAsync(fn, { parallel });
};
