import deps from "./deps.js";

export default ({ countsStore }) =>
  ({
    parallel = 1,
    updatedOnOrAfter,
    updatedBefore,
    limit,
    reverse = false,
    fn,
    transaction,
  }) =>
    deps.db.stream({
      store: countsStore,
      query: {
        ...((updatedOnOrAfter != undefined || updatedBefore != undefined) && {
          updated: {
            ...(updatedOnOrAfter != undefined && { $gte: updatedOnOrAfter }),
            ...(updatedBefore != undefined && { $lt: updatedBefore }),
          },
        }),
      },
      sort: { updated: reverse ? 1 : -1, root: 1 },
      ...(limit != undefined && { limit }),
      parallel,
      fn,
      transaction,
    });
