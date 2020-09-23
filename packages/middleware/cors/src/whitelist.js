const deps = require("../deps");

module.exports = (whitelist) => {
  return {
    check: (origin, callback) => {
      //TODO
      console.log({ origin, whitelist });
      !origin ||
      whitelist.indexOf(origin) !== -1 ||
      whitelist.indexOf("*") !== -1
        ? callback(null, true)
        : callback(deps.unauthorizedError.message("Not allowed by CORS."));
    },
  };
};
