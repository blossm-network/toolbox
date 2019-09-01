const { fn: fnValidator } = require("@sustainers/validation");

module.exports = (fn, { optional } = {}) => {
  return fnValidator({
    value: fn,
    optional
  });
};
