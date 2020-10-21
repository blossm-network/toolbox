const { numberArray: numberArrayValidator } = require("@blossm/validation");

module.exports = (
  numberArray,
  { baseMessageFn, fn, refinementMessageFn, title, path, optional } = {}
) =>
  numberArrayValidator({
    value: numberArray,
    title,
    path,
    baseMessageFn,
    refinementMessageFn,
    optional,
    refinementFn: fn,
  });
