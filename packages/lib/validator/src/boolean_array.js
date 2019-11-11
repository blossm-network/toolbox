const { booleanArray: booleanArrayValidator } = require("@blossm/validation");

module.exports = (
  booleanArray,
  {
    baseMessageFn,
    refinementFn,
    refinementMessageFn,
    title,
    path,
    optional
  } = {}
) =>
  booleanArrayValidator({
    value: booleanArray,
    baseMessageFn,
    refinementMessageFn,
    refinementFn,
    title,
    path,
    optional
  });
