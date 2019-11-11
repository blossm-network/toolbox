const numberRange = require("./number_range");

module.exports = (number, { baseMessageFn, title = "time", optional } = {}) =>
  numberRange(number, {
    lowerBound: 0,
    upperBound: 86399,
    title,
    baseMessageFn,
    optional
  });
