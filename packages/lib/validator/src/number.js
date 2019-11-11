const { number: numberValidator } = require("@blossm/validation");

module.exports = (
  number,
  {
    baseMessageFn,
    refinementMessageFn,
    refinementFn,
    title,
    path,
    optional
  } = {}
) =>
  numberValidator({
    value: number,
    title,
    path,
    baseMessageFn,
    refinementMessageFn,
    optional,
    refinementFn
  });
