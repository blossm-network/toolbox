const { String: tString } = require("tcomb-validation");
const validator = require("./_validator");

module.exports = ({
  value,
  baseMessageFn,
  refinementMessageFn,
  refinementFn,
  title,
  path,
  optional
}) => {
  return validator({
    value,
    isArray: true,
    baseFn: tString,
    baseMessageFn,
    refinementMessageFn,
    refinementFn,
    title,
    path,
    optional
  });
};
