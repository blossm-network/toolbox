const {
  objectArray: objectArrayValidator
} = require("@sustainer-network/validation");

module.exports = (objectArray, { optional } = {}) => {
  return objectArrayValidator({
    value: objectArray,
    optional
  });
};
