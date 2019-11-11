const numberRange = require("./number_range");

module.exports = (
  number,
  { baseMessageFn, title = "percent", path, optional } = {}
) =>
  numberRange(number, {
    lowerBound: 0,
    upperBound: 10000,
    baseMessageFn,
    title,
    path,
    optional
  });
