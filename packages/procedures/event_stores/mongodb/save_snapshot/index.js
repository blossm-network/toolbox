const deps = require("./deps");

module.exports = ({ snapshotStore }) => async ({ snapshot, transaction }) =>
  await deps.db.write({
    store: snapshotStore,
    query: {
      hash: snapshot.hash,
    },
    update: snapshot,
    options: {
      lean: true,
      ...(transaction && { session: transaction }),
    },
  });
