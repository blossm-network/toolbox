const { objectArray: objectArrayValidator } = require("@blossm/validation");

module.exports = (
  objectArray,
  {
    title,
    path,
    baseMessageFn,
    refinementFn,
    refinementMessageFn,
    optional,
  } = {}
) =>
  objectArrayValidator({
    value: objectArray,
    title,
    path,
    baseMessageFn,
    refinementFn,
    refinementMessageFn,
    optional,
  });
