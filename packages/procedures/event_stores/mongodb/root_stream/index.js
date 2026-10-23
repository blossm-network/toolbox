import deps from "./deps.js";

export default ({ countsStore }) => async ({
  parallel = 1,
  transaction,
  updatedOnOrAfter,
  updatedBefore,
  limit,
  reverse = false,
  fn,
}) => {
  const cursor = deps.db
    .find({
      store: countsStore,
      query: {
        ...((updatedOnOrAfter != undefined || updatedBefore != undefined) && {
          updated: {
            ...(updatedOnOrAfter && { $gte: updatedOnOrAfter }),
            ...(updatedBefore && { $lt: updatedBefore }),
          },
        }),
      },
      sort: {
        updated: reverse ? 1 : -1,
        root: 1,
      },
      ...(limit && { limit }),
      options: { lean: true, ...(transaction && { session: transaction }) },
    })
    .cursor();

  return await cursor.eachAsync(fn, { parallel });
};
