const { fnArray: fnArrayValidator } = require("@blossm/validation");

module.exports = (
  fnArray,
  { title, baseMessageFn, refinementMessageFn, refinementFn, optional } = {}
) =>
  fnArrayValidator({
    value: fnArray,
    title,
    baseMessageFn,
    refinementMessageFn,
    refinementFn,
    optional
  });
