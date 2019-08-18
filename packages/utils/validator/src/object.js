const { object: objectValidator } = require("@sustainer-network/validation");

module.exports = (object, { fn, optional } = {}) => {
  return objectValidator({
    value: object,
    optional,
    fn
  });
};
