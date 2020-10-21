const { object: objectValidator } = require("@blossm/validation");

module.exports = (
  object,
  { baseMessageFn, fn, refinementMessageFn, title, path, optional } = {}
) =>
  objectValidator({
    value: object,
    title,
    path,
    baseMessageFn,
    refinementMessageFn,
    refinementFn: fn,
    optional,
  });
