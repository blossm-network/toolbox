const maxAllowedInterval = 10;

const numberRange = require("./number_range");

module.exports = (
  number,
  { baseMessageFn, title = "interval", optional } = {}
) =>
  numberRange(number, {
    lowerBound: 0,
    upperBound: maxAllowedInterval,
    baseMessageFn,
    title,
    optional
  });
