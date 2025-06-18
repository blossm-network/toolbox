import numberRange from "./number_range.js";

export default (
  number,
  { baseMessageFn, title = "title", path, optional } = {}
) =>
  numberRange(number, {
    lowerBound: 1950,
    upperBound: 2100,
    baseMessageFn,
    title,
    path,
    optional,
  });
