import deps from "./deps.js";

export default ({ countsStore, snapshotStore }) =>
  ({
    parallel = 1,
    unsnapshottedOnly = false,
    updatedOnOrAfter,
    updatedBefore,
    limit,
    reverse = false,
    fn,
    transaction,
  }) =>
    (unsnapshottedOnly ? deps.db.streamPendingRoots : deps.db.stream)({
      ...(unsnapshottedOnly && { snapshotStore }),
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
