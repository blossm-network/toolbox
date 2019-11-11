const { stringArray: stringArrayValidator } = require("@blossm/validation");

module.exports = (
  stringArray,
  { baseMessageFn, refinementFn, refinementMessageFn, title, optional } = {}
) =>
  stringArrayValidator({
    value: stringArray,
    optional,
    title,
    baseMessageFn,
    refinementMessageFn,
    refinementFn
  });
