import numberRange from "./number_range.js";

export default (
  number,
  { baseMessageFn, title = "percent", path, optional } = {}
) =>
  numberRange(number, {
    lowerBound: 0,
    upperBound: 10000,
    baseMessageFn,
    title,
    path,
    optional,
  });
