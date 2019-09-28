const logger = require("@sustainers/logger");

module.exports = async ({ store, query, update, options = {} }) => {
  logger.info("db about to write: ", { query, update, options });
  logger.info("db about to write: ", {
    query: { uuid: "asdf" },
    update: { a: 1, uuid: "asdf", create: 123, modified: 123 },
    options: {
      lean: true,
      omitUndefined: true,
      upsert: true,
      new: true,
      runValidators: true,
      setDefaultsOnInsert: true
    }
  });
  return await store.findOneAndUpdate(
    { uuid: "asdf" },
    { a: 1, uuid: "asdf", create: 123, modified: 123 },
    {
      lean: true,
      omitUndefined: true,
      upsert: true,
      new: true,
      runValidators: true,
      setDefaultsOnInsert: true
    }
  );
};
