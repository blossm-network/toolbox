import deps from "./deps.js";

export default ({ snapshotStore }) =>
  ({ query, sort, select, limit = 100, transaction }) =>
    deps.db.find({
      store: snapshotStore,
      query,
      ...(sort && { sort }),
      ...(select && { select }),
      limit,
      transaction,
    });
