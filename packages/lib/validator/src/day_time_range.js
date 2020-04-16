const numberRange = require("./number_range");

module.exports = (
  number,
  { baseMessageFn, title = "time", path, optional } = {}
) =>
  numberRange(number, {
    lowerBound: 0,
    upperBound: 86399,
    title,
    path,
    baseMessageFn,
    optional,
  });
