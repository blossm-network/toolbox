const deps = require("./deps");

module.exports = ({ eventStore }) => async ({
  root,
  from,
  actions,
  parallel = 1,
  fn,
}) => {
  const cursor = deps.db
    .find({
      store: eventStore,
      query: {
        "data.created": { $gte: from },
        ...(root && { "data.root": root }),
        ...(actions && { "data.headers.action": { $in: actions } }),
      },
      sort: { "data.created": 1, "data.number": 1 },
      options: { lean: true },
    })
    .cursor();

  return await cursor.eachAsync(fn, { parallel });
};
