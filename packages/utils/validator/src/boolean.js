const { boolean: booleanValidator } = require("@sustainer-network/validation");

module.exports = (boolean, { fn, optional } = {}) => {
  return booleanValidator({
    value: boolean,
    fn,
    optional
  });
};
