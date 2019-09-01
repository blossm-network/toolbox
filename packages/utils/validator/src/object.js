const { object: objectValidator } = require("@sustainers/validation");

module.exports = (object, { fn, optional } = {}) => {
  return objectValidator({
    value: object,
    optional,
    fn
  });
};
