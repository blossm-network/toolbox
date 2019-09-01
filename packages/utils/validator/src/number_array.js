const { numberArray: numberArrayValidator } = require("@sustainers/validation");

module.exports = (numberArray, { optional } = {}) => {
  return numberArrayValidator({
    value: numberArray,
    optional
  });
};
