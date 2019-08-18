const { fn: fnValidator } = require("@sustainer-network/validation");

module.exports = (fn, { optional } = {}) => {
  return fnValidator({
    value: fn,
    optional
  });
};
