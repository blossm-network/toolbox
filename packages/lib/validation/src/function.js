const { Function } = require("tcomb-validation");
const validator = require("./_validator");

module.exports = ({
  value,
  baseMessageFn,
  refinementFn,
  refinementMessageFn,
  title,
  path,
  optional
}) => {
  return validator({
    value,
    baseFn: Function,
    baseMessageFn,
    refinementMessageFn,
    refinementFn,
    title,
    path,
    optional
  });
};
