const { Object: tObject } = require("tcomb-validation");
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
    baseFn: tObject,
    baseMessageFn,
    refinementMessageFn,
    refinementFn,
    title,
    path,
    optional,
  });
};
