const numberRange = require("./number_range");

module.exports = (number, { baseMessageFn, optional } = {}) =>
  numberRange(number, {
    lowerBound: 0,
    upperBound: 6,
    title: "Day",
    baseMessageFn,
    optional
  });
