const numberRange = require("./number_range");

module.exports = (number, { baseMessageFn, title = "number", optional } = {}) =>
  numberRange(number, {
    lowerBound: 0,
    upperBound: 1000000,
    baseMessageFn,
    title,
    optional
  });
