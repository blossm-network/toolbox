const { fn: fnValidator } = require("@blossm/validation");

module.exports = (
  fn,
  { baseMessageFn, refinementFn, refinementMessageFn, title, optional } = {}
) =>
  fnValidator({
    value: fn,
    title,
    optional,
    refinementFn,
    refinementMessageFn,
    baseMessageFn
  });
