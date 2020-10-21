const { stringArray: stringArrayValidator } = require("@blossm/validation");

module.exports = (
  stringArray,
  { baseMessageFn, fn, refinementMessageFn, title, path, optional } = {}
) =>
  stringArrayValidator({
    value: stringArray,
    optional,
    title,
    path,
    baseMessageFn,
    refinementMessageFn,
    refinementFn: fn,
  });
