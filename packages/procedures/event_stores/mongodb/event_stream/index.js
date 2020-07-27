const deps = require("./deps");

module.exports = ({ eventStore }) => async ({
  parallel = 1,
  query,
  sort,
  fn,
}) => {
  const cursor = deps.db
    .find({
      store: eventStore,
      query,
      ...(sort && { sort }),
      options: { lean: true },
    })
    .cursor();

  return await cursor.eachAsync(fn, { parallel });
};
