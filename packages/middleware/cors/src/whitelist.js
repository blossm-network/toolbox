const deps = require("../deps");

module.exports = (whitelist) => {
  return {
    check: (origin, callback) => {
      !origin || whitelist.indexOf(origin) !== -1
        ? callback(null, true)
        : callback(deps.unauthorizedError.message("Not allowed by CORS."));
    },
  };
};
