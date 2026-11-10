import deps from "./deps.js";

export default ({ countsStore }) => ({ root, amount, transaction }) =>
  deps.db.write({
    store: countsStore,
    query: { root },
    update: {
      $inc: { value: amount },
      $set: {
        updated: deps.dateString(),
      },
    },
    options: {
      lean: true,
      omitUndefined: true,
      upsert: true,
      returnDocument: "after",
      runValidators: true,
      setDefaultsOnInsert: true,
      ...(transaction && { session: transaction }),
    },
  });
