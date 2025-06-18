import numberRange from "./number_range.js";

export default (
  number,
  { baseMessageFn, title = "date", path, optional } = {}
) => {
  return numberRange(number, {
    lowerBound: 1,
    upperBound: 31,
    baseMessageFn,
    title,
    path,
    optional,
  });
};
