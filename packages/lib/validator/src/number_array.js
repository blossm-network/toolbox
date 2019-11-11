const { numberArray: numberArrayValidator } = require("@blossm/validation");

module.exports = (
  numberArray,
  {
    baseMessageFn,
    refinementFn,
    refinementMessageFn,
    title,
    path,
    optional
  } = {}
) =>
  numberArrayValidator({
    value: numberArray,
    title,
    path,
    baseMessageFn,
    refinementMessageFn,
    optional,
    refinementFn
  });
