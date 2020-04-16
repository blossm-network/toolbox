const { fn: fnValidator } = require("@blossm/validation");

module.exports = (
  fn,
  {
    baseMessageFn,
    refinementFn,
    refinementMessageFn,
    title,
    path,
    optional,
  } = {}
) =>
  fnValidator({
    value: fn,
    title,
    path,
    optional,
    refinementFn,
    refinementMessageFn,
    baseMessageFn,
  });
