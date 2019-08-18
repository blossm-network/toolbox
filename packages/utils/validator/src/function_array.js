const { fnArray: fnArrayValidator } = require("@sustainer-network/validation");

module.exports = (fnArray, { optional } = {}) => {
  return fnArrayValidator({
    value: fnArray,
    optional
  });
};
