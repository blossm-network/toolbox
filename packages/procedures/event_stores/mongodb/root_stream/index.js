const deps = require("./deps");

module.exports = ({ countsStore }) => async ({
  parallel = 1,
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
      },
      ...(limit && { limit }),
      options: { lean: true },
    })
    .cursor();

  return await cursor.eachAsync(fn, { parallel });
};
