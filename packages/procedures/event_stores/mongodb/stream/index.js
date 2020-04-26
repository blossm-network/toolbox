const deps = require("./deps");

module.exports = ({ eventStore }) => async ({
  root,
  from,
  parallel = 1,
  fn,
}) => {
  const stuff = deps.db.find({
    store: eventStore,
    query: { "headers.root": root },
    options: { lean: true },
  });
  //TODO
  //eslint-disable-next-line no-console
  console.log("In mongodb stream: ", { stuff, root, from, parallel, fn });
  const cursor = deps.db
    .find({
      store: eventStore,
      query: { "headers.root": root, "headers.number": { $gte: from } },
      sort: { "headers.number": 1 },
      options: { lean: true },
    })
    .cursor();

  return await cursor.eachAsync(fn, { parallel });
};
