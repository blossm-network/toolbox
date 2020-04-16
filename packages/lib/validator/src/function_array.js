const { fnArray: fnArrayValidator } = require("@blossm/validation");

module.exports = (
  fnArray,
  {
    title,
    path,
    baseMessageFn,
    refinementMessageFn,
    refinementFn,
    optional,
  } = {}
) =>
  fnArrayValidator({
    value: fnArray,
    title,
    path,
    baseMessageFn,
    refinementMessageFn,
    refinementFn,
    optional,
  });
