import deps from "./deps.js";

export default ({ eventStore }) =>
  ({ parallel = 1, query, sort, limit, fn, transaction }) =>
    deps.db.stream({
      store: eventStore,
      query,
      ...(sort && { sort }),
      ...(limit != undefined && { limit }),
      parallel,
      fn,
      transaction,
    });
