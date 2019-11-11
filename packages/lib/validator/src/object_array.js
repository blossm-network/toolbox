const { objectArray: objectArrayValidator } = require("@blossm/validation");

module.exports = (
  objectArray,
  { title, baseMessageFn, refinementFn, refinementMessageFn, optional } = {}
) =>
  objectArrayValidator({
    value: objectArray,
    title,
    baseMessageFn,
    refinementFn,
    refinementMessageFn,
    optional
  });
