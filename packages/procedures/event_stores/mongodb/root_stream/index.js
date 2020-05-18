const deps = require("./deps");

module.exports = ({ countsStore }) => async ({ parallel = 1, fn }) => {
  const cursor = deps.db
    .find({
      store: countsStore,
      query: {},
      options: { lean: true },
    })
    .cursor();

  return await cursor.eachAsync(fn, { parallel });
};
