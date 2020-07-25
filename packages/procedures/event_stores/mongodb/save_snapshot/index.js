const deps = require("./deps");

module.exports = ({ snapshotStore }) => ({ snapshot, transaction }) =>
  deps.db.write({
    store: snapshotStore,
    query: {
      hash: snapshot.hash,
    },
    update: snapshot,
    options: {
      lean: true,
      omitUndefined: true,
      upsert: true,
      new: true,
      runValidators: true,
      ...(transaction && { session: transaction }),
    },
  });
