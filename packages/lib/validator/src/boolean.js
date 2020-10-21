const { boolean: booleanValidator } = require("@blossm/validation");

module.exports = (
  boolean,
  { baseMessageFn, refinementMessageFn, fn, title, path, optional } = {}
) =>
  booleanValidator({
    value: boolean,
    baseMessageFn,
    refinementMessageFn,
    refinementFn: fn,
    title,
    path,
    optional,
  });
