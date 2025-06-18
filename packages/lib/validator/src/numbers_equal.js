import { number as numberValidator } from "@blossm/validation";
import doNumbersEqual from "./_do_numbers_equal.js";

export default (
  number1,
  number2,
  { baseMessageFn, title = "numbers", path, optional } = {}
) =>
  numberValidator({
    value: number1,
    title,
    path,
    baseMessageFn,
    refinementMessageFn: (_, title) =>
      `These ${title.toLowerCase()} don't match up.`,
    refinementFn: (number) => doNumbersEqual(number, number2),
    optional,
  });
