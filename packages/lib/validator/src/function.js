const { fn: fnValidator } = require("@blossm/validation");

module.exports = (
  fn,
  { baseMessageFn, fn: func, refinementMessageFn, title, path, optional } = {}
) =>
  fnValidator({
    value: fn,
    title,
    path,
    optional,
    refinementFn: func,
    refinementMessageFn,
    baseMessageFn,
  });
