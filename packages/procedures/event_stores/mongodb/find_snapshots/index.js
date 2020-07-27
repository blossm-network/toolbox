const deps = require("./deps");

module.exports = ({ snapshotStore }) => async ({ query, sort }) =>
  deps.db.find({
    store: snapshotStore,
    query,
    ...(sort && { sort }),
    limit: 100,
    options: {
      lean: true,
    },
  });
