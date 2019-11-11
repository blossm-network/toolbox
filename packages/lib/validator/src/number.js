const { number: numberValidator } = require("@blossm/validation");

module.exports = (
  number,
  { baseMessageFn, refinementMessageFn, refinementFn, title, optional } = {}
) =>
  numberValidator({
    value: number,
    title,
    baseMessageFn,
    refinementMessageFn,
    optional,
    refinementFn
  });
