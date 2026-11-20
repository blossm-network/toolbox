import deps from "./deps.js";

export default ({ snapshotStore }) =>
  async ({ query, sort, select, transaction }) => {
    const [snapshot = null] = await deps.db.find({
      store: snapshotStore,
      query,
      ...(sort && { sort }),
      ...(select && { select }),
      limit: 1,
      transaction,
    });

    return snapshot;
  };
