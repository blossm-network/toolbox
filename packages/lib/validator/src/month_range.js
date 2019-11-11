const numberRange = require("./number_range");

module.exports = (number, { baseMessageFn, title = "month", optional } = {}) =>
  numberRange(number, {
    lowerBound: 0,
    upperBound: 11,
    baseMessageFn,
    title,
    optional
  });
