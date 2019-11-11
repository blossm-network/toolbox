const numberRange = require("./number_range");

module.exports = (
  number,
  { baseMessageFn, title = "percent", optional } = {}
) =>
  numberRange(number, {
    lowerBound: 0,
    upperBound: 10000,
    baseMessageFn,
    title,
    optional
  });
