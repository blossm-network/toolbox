const { list, String } = require("tcomb-validation");
const validator = require("./_validator");

module.exports = ({ value, message, fn, optional }) => {
  return validator({
    value,
    refinementType: list(String),
    message,
    fn,
    optional
  });
};
