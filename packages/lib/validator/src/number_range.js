const { number: numberValidator } = require("@blossm/validation");
const isNumberInRange = require("./_is_number_in_range");
const numberTooBigMessage = require("./_number_too_big_message");
const numberTooSmallMessage = require("./_number_too_small_message");

module.exports = (
  number,
  {
    baseMessageFn,
    lowerBound,
    upperBound,
    title = "range",
    path,
    optional
  } = {}
) =>
  numberValidator({
    value: number,
    title,
    path,
    baseMessageFn,
    refinementFn: number => isNumberInRange({ number, lowerBound, upperBound }),
    refinementMessageFn: (number, title) => {
      if (number > upperBound) {
        return numberTooBigMessage({
          title,
          max: upperBound
        });
      }
      if (number < lowerBound) {
        return numberTooSmallMessage({
          title,
          min: lowerBound
        });
      }
    },
    optional
  });
