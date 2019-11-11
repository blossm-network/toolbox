const { string: stringValidator } = require("@blossm/validation");
const findError = require("./find_error");
const number = require("./number");

module.exports = (value, { baseMessageFn, title = "date", optional } = {}) =>
  stringValidator({
    value,
    title,
    baseMessageFn,
    refinementMessageFn: (_, title) =>
      `This ${title.toLowerCase()} couldn't be parsed. Try again after making a change to it.`,
    refinementFn: value => !findError([number(Date.parse(value))]),
    optional
  });
