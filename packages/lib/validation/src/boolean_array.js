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
    isArray: true,
    baseFn: tBoolean,
    baseMessageFn,
    refinementMessageFn,
    refinementFn,
    title,
    optional
  });
};
