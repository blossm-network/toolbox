const { list, Boolean } = require("tcomb-validation");
const validator = require("./_validator");

module.exports = ({ value, message, fn, optional }) => {
  return validator({
    value,
    refinementType: list(Boolean),
    message,
    fn,
    optional
  });
};
