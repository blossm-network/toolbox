const { numberArray: numberArrayValidator } = require("@blossm/validation");

module.exports = (
  numberArray,
  { baseMessageFn, refinementFn, refinementMessageFn, title, optional } = {}
) =>
  numberArrayValidator({
    value: numberArray,
    title,
    baseMessageFn,
    refinementMessageFn,
    optional,
    refinementFn
  });
