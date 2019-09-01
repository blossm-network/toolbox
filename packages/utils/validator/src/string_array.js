const { stringArray: stringArrayValidator } = require("@sustainers/validation");

module.exports = (stringArray, { fn, optional } = {}) => {
  return stringArrayValidator({
    value: stringArray,
    optional,
    fn
  });
};
