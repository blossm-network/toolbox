const { booleanArray: booleanArrayValidator } = require("@blossm/validation");

module.exports = (
  booleanArray,
  { baseMessageFn, fn, refinementMessageFn, title, path, optional } = {}
) =>
  booleanArrayValidator({
    value: booleanArray,
    baseMessageFn,
    refinementMessageFn,
    refinementFn: fn,
    title,
    path,
    optional,
  });
