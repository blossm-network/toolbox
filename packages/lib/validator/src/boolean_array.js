const { booleanArray: booleanArrayValidator } = require("@blossm/validation");

module.exports = (booleanArray, { optional } = {}) => {
  return booleanArrayValidator({
    value: booleanArray,
    optional
  });
};
