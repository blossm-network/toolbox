const { unauthorized } = require("@sustainers/errors");
const logger = require("@sustainers/logger");

module.exports = whitelist => {
  return {
    check: (origin, callback) => {
      logger.info("cors: ", { whitelist, origin });
      if (whitelist.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(unauthorized.cors);
      }
    }
  };
};
