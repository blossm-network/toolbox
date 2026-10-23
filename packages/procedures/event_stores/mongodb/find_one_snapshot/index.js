import deps from "./deps.js";

export default ({ snapshotStore }) => async ({ query, sort, select, transaction }) =>
  deps.db.findOne({
    store: snapshotStore,
    query,
    ...(sort && { sort }),
    ...(select && { select }),
    options: {
      lean: true,
      ...(transaction && { session: transaction }),
    },
  });
