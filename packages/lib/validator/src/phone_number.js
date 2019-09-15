const { string: stringValidator } = require("@sustainers/validation");
const phoneNumber = require("@sustainers/phone-number");

module.exports = (value, { optional } = {}) => {
  return stringValidator({
    value,
    message: () =>
      "This phone number isn't formatted right. Try again after making a change to it.",
    fn: number => phoneNumber.format(number) != null,
    optional
  });
};
