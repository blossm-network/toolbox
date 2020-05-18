const deps = require("./deps");

module.exports = ({ countStore }) => async ({ parallel = 1, fn }) => {
  const cursor = deps.db
    .find({
      store: countStore,
      query: {},
      options: { lean: true },
    })
    .cursor();

  return await cursor.eachAsync(fn, { parallel });
};
