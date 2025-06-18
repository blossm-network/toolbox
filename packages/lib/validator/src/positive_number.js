import numberRange from "./number_range.js";

export default (
  number,
  { baseMessageFn, title = "number", path, optional } = {}
) =>
  numberRange(number, {
    lowerBound: 0,
    upperBound: 1000000,
    baseMessageFn,
    title,
    path,
    optional,
  });
