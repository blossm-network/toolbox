const { Function: tFunction } = require("tcomb-validation");
const validator = require("./_validator");

module.exports = ({
  value,
  baseMessageFn,
  refinementMessageFn,
  refinementFn,
  title,
  path,
  optional,
}) => {
  return validator({
    value,
    isArray: true,
    baseFn: tFunction,
    baseMessageFn,
    refinementMessageFn,
    refinementFn,
    title,
    path,
    optional,
  });
};
