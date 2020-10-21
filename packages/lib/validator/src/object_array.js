const { objectArray: objectArrayValidator } = require("@blossm/validation");

module.exports = (
  objectArray,
  { title, path, baseMessageFn, fn, refinementMessageFn, optional } = {}
) =>
  objectArrayValidator({
    value: objectArray,
    title,
    path,
    baseMessageFn,
    refinementFn: fn,
    refinementMessageFn,
    optional,
  });
