const { numberArray: numberArrayValidator } = require("@blossm/validation");

module.exports = (numberArray, { optional } = {}) => {
  return numberArrayValidator({
    value: numberArray,
    optional
  });
};
