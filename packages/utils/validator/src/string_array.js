const { stringArray: stringArrayValidator } = require("@sustainer-network/validation");

module.exports = (stringArray, { fn, optional } = {}) => {
  return stringArrayValidator({
    value: stringArray,
    optional,
    fn
  });
};
