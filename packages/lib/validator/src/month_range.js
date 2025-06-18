import numberRange from "./number_range.js";

export default (
  number,
  { baseMessageFn, title = "month", path, optional } = {}
) =>
  numberRange(number, {
    lowerBound: 0,
    upperBound: 11,
    baseMessageFn,
    title,
    path,
    optional,
  });
