const logger = require("@sustainers/logger");

module.exports = async ({ store, query, update, options = {} }) => {
  logger.info("db about to write: ", { query, update, options });
  return await store.findOneAndUpdate(query, update, options);
};
