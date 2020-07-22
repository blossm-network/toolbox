const deps = require("./deps");

module.exports = ({ countsStore }) => ({ root, amount, transaction }) =>
  deps.db.write({
    store: countsStore,
    query: { root },
    update: {
      $inc: { value: amount },
      //TODO test
      $set: {
        updated: deps.dateString(),
      },
    },
    options: {
      lean: true,
      omitUndefined: true,
      upsert: true,
      new: true,
      runValidators: true,
      setDefaultsOnInsert: true,
      ...(transaction && { session: transaction }),
    },
  });
