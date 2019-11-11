const { booleanArray: booleanArrayValidator } = require("@blossm/validation");

module.exports = (
  booleanArray,
  { baseMessageFn, refinementFn, refinementMessageFn, title, optional } = {}
) =>
  booleanArrayValidator({
    value: booleanArray,
    baseMessageFn,
    refinementMessageFn,
    refinementFn,
    title,
    optional
  });
