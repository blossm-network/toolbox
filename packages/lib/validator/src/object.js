const { object: objectValidator } = require("@blossm/validation");

module.exports = (object, { fn, optional } = {}) => {
  return objectValidator({
    value: object,
    optional,
    fn
  });
};
