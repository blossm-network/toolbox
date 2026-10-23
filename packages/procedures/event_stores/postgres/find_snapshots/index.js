import deps from "./deps.js";

export default ({ snapshotStore }) =>
  ({ query, sort, transaction }) =>
    deps.db.find({
      store: snapshotStore,
      query,
      ...(sort && { sort }),
      limit: 100,
      transaction,
    });
