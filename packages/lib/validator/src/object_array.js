const { objectArray: objectArrayValidator } = require("@blossm/validation");

module.exports = (objectArray, { optional } = {}) => {
  return objectArrayValidator({
    value: objectArray,
    optional
  });
};
