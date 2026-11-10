import deps from "./deps.js";

export default ({ snapshotStore }) => ({ snapshot, transaction }) =>
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
      returnDocument: "after",
      runValidators: true,
      ...(transaction && { session: transaction }),
    },
  });
