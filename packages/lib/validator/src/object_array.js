const { objectArray: objectArrayValidator } = require("@sustainers/validation");

module.exports = (objectArray, { optional } = {}) => {
  return objectArrayValidator({
    value: objectArray,
    optional
  });
};
