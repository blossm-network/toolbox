const { fnArray: fnArrayValidator } = require("@blossm/validation");

module.exports = (
  fnArray,
  { title, path, baseMessageFn, refinementMessageFn, fn, optional } = {}
) =>
  fnArrayValidator({
    value: fnArray,
    title,
    path,
    baseMessageFn,
    refinementMessageFn,
    refinementFn: fn,
    optional,
  });
