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
      query: { "data.root": root, "data.number": { $gte: from } },
      sort: { "data.number": 1 },
      options: { lean: true },
    })
    .cursor();

  return await cursor.eachAsync(fn, { parallel });
};
