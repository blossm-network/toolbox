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
        //TODO add integration test for this
        "data.saved": { $gte: from },
        //TODO test
        ...(root && { "data.root": root }),
        //TODO test
        ...(actions && { "data.headers.action": { $in: actions } }),
      },
      //TODO test
      sort: { "data.saved": 1, "data.number": 1 },
      options: { lean: true },
    })
    .cursor();

  return await cursor.eachAsync(fn, { parallel });
};
