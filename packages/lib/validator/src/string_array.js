const { stringArray: stringArrayValidator } = require("@blossm/validation");

module.exports = (
  stringArray,
  {
    baseMessageFn,
    refinementFn,
    refinementMessageFn,
    title,
    path,
    optional,
  } = {}
) =>
  stringArrayValidator({
    value: stringArray,
    optional,
    title,
    path,
    baseMessageFn,
    refinementMessageFn,
    refinementFn,
  });
