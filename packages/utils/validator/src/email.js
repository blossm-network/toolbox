const { string: stringValidator } = require("@sustainer-network/validation");
const emailValidator = require("@sustainer-network/email-validator");

module.exports = (value, { optional } = {}) => {
  return stringValidator({
    value,
    message: () =>
      "This email isn't formatted right, maybe it’s a typo? Try again after making a change to it.",
    fn: emailValidator.validate,
    optional
  });
};
