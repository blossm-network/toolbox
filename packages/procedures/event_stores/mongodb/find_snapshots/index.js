import deps from "./deps.js";

export default ({ snapshotStore }) =>
  async ({ query, sort, select, limit = 100 }) =>
    deps.db.aggregate({
      store: snapshotStore,
      query,
      ...(sort && { sort }),
      ...(select && { select }),
      limit,
    });
