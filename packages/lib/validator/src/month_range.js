const numberRange = require("./number_range");

module.exports = (
  number,
  { baseMessageFn, title = "month", path, optional } = {}
) =>
  numberRange(number, {
    lowerBound: 0,
    upperBound: 11,
    baseMessageFn,
    title,
    path,
    optional
  });
