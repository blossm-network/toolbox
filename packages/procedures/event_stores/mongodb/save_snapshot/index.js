const deps = require("./deps");

module.exports = ({ snapshotStore }) => async ({ snapshot, transaction }) => {
  const [result] = await deps.db.create({
    store: snapshotStore,
    data: snapshot,
    options: {
      lean: true,
      ...(transaction && { session: transaction }),
    },
  });
  return result;
};
