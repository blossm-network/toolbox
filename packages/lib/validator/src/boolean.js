const { boolean: booleanValidator } = require("@blossm/validation");

module.exports = (boolean, { fn, optional } = {}) => {
  return booleanValidator({
    value: boolean,
    fn,
    optional
  });
};
