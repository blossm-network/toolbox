const { numberArray: numberArrayValidator } = require("@sustainer-network/validation");

module.exports = (numberArray, { optional } = {}) => {
  return numberArrayValidator({
    value: numberArray,
    optional
  });
};
