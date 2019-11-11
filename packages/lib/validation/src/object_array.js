const { Object: tObject } = require("tcomb-validation");
const validator = require("./_validator");

module.exports = ({
  value,
  refinementFn,
  baseMessageFn,
  refinementMessageFn,
  title,
  optional
}) => {
  return validator({
    value,
    isArray: true,
    baseFn: tObject,
    baseMessageFn,
    refinementMessageFn,
    refinementFn,
    title,
    optional
  });
};
