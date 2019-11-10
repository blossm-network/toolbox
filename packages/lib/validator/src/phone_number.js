const { string: stringValidator } = require("@blossm/validation");
const phoneNumber = require("@blossm/phone-number");

module.exports = (value, { optional } = {}) => {
  return stringValidator({
    value,
    message: () =>
      "This phone number isn't formatted right. Try again after making a change to it.",
    fn: number => phoneNumber.format(number) != null,
    optional
  });
};
