const numberRange = require("./number_range");

module.exports = (number, { baseMessageFn, title = "title", optional } = {}) =>
  numberRange(number, {
    lowerBound: 1950,
    upperBound: 2100,
    baseMessageFn,
    title,
    optional
  });
