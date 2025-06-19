import deps from "./deps.js";

export default ({ eventStore }) => async ({
  parallel = 1,
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
      options: { lean: true },
    })
    .cursor();

  return await cursor.eachAsync(fn, { parallel });
};
