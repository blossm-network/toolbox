const { number: numberValidator } = require("@sustainers/validation");
const isNumberInRange = require("./_is_number_in_range");
const numberTooBigMessage = require("./_number_too_big_message");
const numberTooSmallMessage = require("./_number_too_small_message");

module.exports = (number, { lowerBound, upperBound, title, optional } = {}) => {
  return numberValidator({
    value: number,
    fn: number => isNumberInRange({ number, lowerBound, upperBound }),
    message: number => {
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
};
