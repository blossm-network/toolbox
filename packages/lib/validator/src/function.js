const { fn: fnValidator } = require("@blossm/validation");

module.exports = (fn, { optional } = {}) => {
  return fnValidator({
    value: fn,
    optional
  });
};
