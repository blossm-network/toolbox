const {
  booleanArray: booleanArrayValidator
} = require("@sustainers/validation");

module.exports = (booleanArray, { optional } = {}) => {
  return booleanArrayValidator({
    value: booleanArray,
    optional
  });
};
