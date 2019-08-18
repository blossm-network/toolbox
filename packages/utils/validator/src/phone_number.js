const { string: stringValidator } = require("@sustainer-network/validation");
const phoneNumber = require("@sustainer-network/phone-number");

module.exports = (value, { optional } = {}) => {
  return stringValidator({
    value,
    message: () =>
      "This phone number isn't formatted right. Try again after making a change to it.",
    fn: number => phoneNumber.format(number) != null,
    optional
  });
};
