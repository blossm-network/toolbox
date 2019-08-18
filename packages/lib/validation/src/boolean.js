const { Boolean } = require("tcomb-validation");
const validator = require("./_validator");

module.exports = ({ value, message, fn, optional }) => {
  return validator({ value, refinementType: Boolean, message, fn, optional });
};
