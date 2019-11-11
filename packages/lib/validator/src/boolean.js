const { boolean: booleanValidator } = require("@blossm/validation");

module.exports = (
  boolean,
  { baseMessageFn, refinementMessageFn, refinementFn, title, optional } = {}
) =>
  booleanValidator({
    value: boolean,
    baseMessageFn,
    refinementMessageFn,
    refinementFn,
    title,
    optional
  });
