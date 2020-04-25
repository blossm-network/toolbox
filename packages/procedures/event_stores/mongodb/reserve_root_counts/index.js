const deps = require("./deps");

module.exports = ({ countsStore }) => ({ root, amount }) =>
  deps.db.write({
    store: countsStore,
    query: { root },
    update: { $inc: { value: amount } },
    options: {
      lean: true,
      omitUndefined: true,
      upsert: true,
      new: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    },
  });
