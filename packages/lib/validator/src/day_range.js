const numberRange = require("./number_range");

module.exports = (
  number,
  { title = "day", path, baseMessageFn, optional } = {}
) =>
  numberRange(number, {
    lowerBound: 0,
    upperBound: 6,
    title,
    path,
    baseMessageFn,
    optional,
  });
