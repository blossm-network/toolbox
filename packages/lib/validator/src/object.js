const { object: objectValidator } = require("@blossm/validation");

module.exports = (
  object,
  {
    baseMessageFn,
    refinementFn,
    refinementMessageFn,
    title,
    path,
    optional,
  } = {}
) =>
  objectValidator({
    value: object,
    title,
    path,
    baseMessageFn,
    refinementMessageFn,
    refinementFn,
    optional,
  });
