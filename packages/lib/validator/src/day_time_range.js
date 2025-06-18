import numberRange from "./number_range.js";

export default (
  number,
  { baseMessageFn, title = "time", path, optional } = {}
) =>
  numberRange(number, {
    lowerBound: 0,
    upperBound: 86399,
    title,
    path,
    baseMessageFn,
    optional,
  });
