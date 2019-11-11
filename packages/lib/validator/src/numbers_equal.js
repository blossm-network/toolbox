const { number: numberValidator } = require("@blossm/validation");
const doNumbersEqual = require("./_do_numbers_equal");

module.exports = (
  number1,
  number2,
  { baseMessageFn, title = "numbers", optional } = {}
) =>
  numberValidator({
    value: number1,
    title,
    baseMessageFn,
    refinementMessageFn: (_, title) =>
      `These ${title.toLowerCase()} don't match up.`,
    refinementFn: number => doNumbersEqual(number, number2),
    optional
  });
