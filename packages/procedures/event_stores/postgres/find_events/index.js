import deps from "./deps.js";

export default ({ eventStore }) =>
  ({ query, sort, transaction }) =>
    deps.db.find({
      store: eventStore,
      query,
      ...(sort && { sort }),
      limit: 100,
      transaction,
    });
