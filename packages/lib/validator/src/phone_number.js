const { string: stringValidator } = require("@blossm/validation");
const phoneNumber = require("@blossm/phone-number");

module.exports = (
  value,
  { baseMessageFn, title = "phone number", optional } = {}
) =>
  stringValidator({
    value,
    title,
    baseMessageFn,
    refinementMessageFn: (value, title) =>
      `This ${title} isn't formatted right. Try again after making a change to it.`,
    refinementFn: number => phoneNumber.format(number) != null,
    optional
  });
