const deps = require("../deps");

module.exports = whitelist => {
  return {
    check: (origin, callback) => {
      //TODO
      //eslint-disable-next-line no-console
      console.log({ origin });
      if (!origin || whitelist.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(deps.unauthorizedError.cors());
      }
    }
  };
};
