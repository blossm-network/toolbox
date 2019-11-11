const { object: objectValidator } = require("@blossm/validation");

module.exports = (
  object,
  { baseMessageFn, refinementFn, refinementMessageFn, title, optional } = {}
) =>
  objectValidator({
    value: object,
    title,
    baseMessageFn,
    refinementMessageFn,
    refinementFn,
    optional
  });
