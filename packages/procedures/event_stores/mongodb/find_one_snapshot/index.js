import deps from "./deps.js";

export default ({ snapshotStore }) => async ({ query, sort, select }) =>
  deps.db.findOne({
    store: snapshotStore,
    query,
    ...(sort && { sort }),
    ...(select && { select }),
    options: {
      lean: true,
    },
  });
