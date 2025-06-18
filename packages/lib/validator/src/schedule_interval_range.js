const maxAllowedInterval = 10;

import numberRange from "./number_range.js";

export default (
  number,
  { baseMessageFn, title = "interval", path, optional } = {}
) =>
  numberRange(number, {
    lowerBound: 0,
    upperBound: maxAllowedInterval,
    baseMessageFn,
    title,
    path,
    optional,
  });
