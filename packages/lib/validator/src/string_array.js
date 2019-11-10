const { stringArray: stringArrayValidator } = require("@blossm/validation");

module.exports = (stringArray, { fn, optional } = {}) => {
  return stringArrayValidator({
    value: stringArray,
    optional,
    fn
  });
};
