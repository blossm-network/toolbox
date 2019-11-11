const { Number: tNumber } = require("tcomb-validation");
const validator = require("./_validator");

module.exports = ({
  value,
  baseMessageFn,
  refinementFn,
  refinementMessageFn,
  title,
  optional
}) => {
  return validator({
    value,
    isArray: true,
    baseFn: tNumber,
    baseMessageFn,
    refinementMessageFn,
    refinementFn,
    title,
    optional
  });
};
