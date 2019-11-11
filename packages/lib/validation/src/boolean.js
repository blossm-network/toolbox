const { Boolean: tBoolean } = require("tcomb-validation");
const validator = require("./_validator");

module.exports = ({
  value,
  baseMessageFn,
  refinementMessageFn,
  refinementFn,
  title,
  optional
}) => {
  return validator({
    value,
    baseFn: tBoolean,
    baseMessageFn,
    refinementMessageFn,
    refinementFn,
    title,
    optional
  });
};
