const { Object } = require("tcomb-validation");
const validator = require("./_validator");

module.exports = ({ value, message, fn, optional }) => {
  return validator({ value, refinementType: Object, message, fn, optional });
};
