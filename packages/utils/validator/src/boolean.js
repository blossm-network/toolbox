const { boolean: booleanValidator } = require("@sustainers/validation");

module.exports = (boolean, { fn, optional } = {}) => {
  return booleanValidator({
    value: boolean,
    fn,
    optional
  });
};
