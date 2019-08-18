const { booleanArray: booleanArrayValidator } = require("@sustainer-network/validation");

module.exports = (booleanArray, { optional } = {}) => {
  return booleanArrayValidator({
    value: booleanArray,
    optional
  });
};
