const { fnArray: fnArrayValidator } = require("@blossm/validation");

module.exports = (fnArray, { optional } = {}) => {
  return fnArrayValidator({
    value: fnArray,
    optional
  });
};
