const { Function } = require("tcomb-validation");
const validator = require("./_validator");

module.exports = ({ value, optional }) => {
  return validator({
    value,
    refinementType: Function,
    optional
  });
};
