const { fnArray: fnArrayValidator } = require("@sustainers/validation");

module.exports = (fnArray, { optional } = {}) => {
  return fnArrayValidator({
    value: fnArray,
    optional
  });
};
