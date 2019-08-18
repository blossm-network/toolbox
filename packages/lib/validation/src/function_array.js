const { list, Function } = require("tcomb-validation");
const validator = require("./_validator");

module.exports = ({ value, message, fn, optional }) => {
  return validator({
    value,
    refinementType: list(Function),
    message,
    fn,
    optional
  });
};
