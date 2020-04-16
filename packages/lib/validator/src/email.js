const { string: stringValidator } = require("@blossm/validation");
const emailValidator = require("@blossm/email-validator");

module.exports = (
  value,
  { baseMessageFn, title = "email", path, optional } = {}
) =>
  stringValidator({
    value,
    baseMessageFn,
    title,
    path,
    refinementMessageFn: (_, title) =>
      `This ${title.toLowerCase()} isn't formatted right, maybe it’s a typo? Try again after making a change to it.`,
    refinementFn: emailValidator,
    optional,
  });
