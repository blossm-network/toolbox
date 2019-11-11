const { string: stringValidator } = require("@blossm/validation");

const regex = /^[+-]?([0-9]*[.])?[0-9]+$/;

module.exports = (value, { baseMessageFn, title, optional } = {}) =>
  stringValidator({
    value,
    title,
    baseMessageFn,
    refinementFn: numeric => regex.test(numeric),
    refinementMessageFn: (_, title) => `${title} should be a number.`,
    optional
  });
