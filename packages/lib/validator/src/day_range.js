import numberRange from "./number_range.js";

export default (
  number,
  { title = "day", path, baseMessageFn, optional } = {}
) =>
  numberRange(number, {
    lowerBound: 0,
    upperBound: 6,
    title,
    path,
    baseMessageFn,
    optional,
  });
