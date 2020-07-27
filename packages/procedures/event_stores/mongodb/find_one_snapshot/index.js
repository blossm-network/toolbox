const deps = require("./deps");

module.exports = ({ snapshotStore }) => async ({ query, sort, select }) =>
  deps.db.findOne({
    store: snapshotStore,
    query,
    ...(sort && { sort }),
    ...(select && { select }),
    options: {
      lean: true,
    },
  });
