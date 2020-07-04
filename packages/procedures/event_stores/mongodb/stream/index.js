const deps = require("./deps");

module.exports = ({ eventStore }) => async ({
  root,
  from,
  parallel = 1,
  fn,
}) => {
  const cursor = deps.db
    .find({
      store: eventStore,
      query: { root, "headers.number": { $gte: from } },
      sort: { "headers.number": 1 },
      options: { lean: true },
    })
    .cursor();

  return await cursor.eachAsync(fn, { parallel });
};
