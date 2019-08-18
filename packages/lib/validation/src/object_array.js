const { list, Object } = require("tcomb-validation");
const validator = require("./_validator");

module.exports = ({ value, message, fn, optional }) => {
  return validator({
    value,
    refinementType: list(Object),
    message,
    fn,
    optional
  });
};
