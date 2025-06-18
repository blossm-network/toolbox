import { number as numberValidator } from "@blossm/validation";
import isNumberInRange from "./_is_number_in_range.js";
import numberTooBigMessage from "./_number_too_big_message.js";
import numberTooSmallMessage from "./_number_too_small_message.js";

export default (
  number,
  {
    baseMessageFn,
    lowerBound,
    upperBound,
    title = "range",
    path,
    optional,
  } = {}
) =>
  numberValidator({
    value: number,
    title,
    path,
    baseMessageFn,
    refinementFn: (number) =>
      isNumberInRange({ number, lowerBound, upperBound }),
    refinementMessageFn: (number, title) => {
      if (number > upperBound) {
        return numberTooBigMessage({
          title,
          max: upperBound,
        });
      }
      if (number < lowerBound) {
        return numberTooSmallMessage({
          title,
          min: lowerBound,
        });
      }
    },
    optional,
  });
