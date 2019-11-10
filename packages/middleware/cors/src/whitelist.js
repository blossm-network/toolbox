const { unauthorized } = require("@blossm/errors");

module.exports = whitelist => {
  return {
    check: (origin, callback) => {
      if (!origin || whitelist.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(unauthorized.cors());
      }
    }
  };
};
