const { string: stringValidator } = require("@blossm/validation");
const emailValidator = require("@blossm/email-validator");

module.exports = (value, { optional } = {}) => {
  return stringValidator({
    value,
    message: () =>
      "This email isn't formatted right, maybe it’s a typo? Try again after making a change to it.",
    fn: emailValidator,
    optional
  });
};
