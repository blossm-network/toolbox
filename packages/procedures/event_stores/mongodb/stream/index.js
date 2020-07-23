const deps = require("./deps");

module.exports = ({ eventStore }) => async ({
  root,
  from,
  actions,
  parallel = 1,
  fn,
}) => {
  //TODO what i really want here is to stream aggregates.

  //look for a snapshot. if its there, pass it to fn and stream events past it.
  const cursor = deps.db
    .find({
      store: eventStore,
      query: {
        "headers.created": { $gte: from },
        ...(root && { "headers.root": root }),
        ...(actions && { "headers.action": { $in: actions } }),
      },
      sort: { "headers.created": 1, "headers.number": 1 },
      options: { lean: true },
    })
    .cursor();

  return await cursor.eachAsync(fn, { parallel });
};
