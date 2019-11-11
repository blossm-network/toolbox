const numberRange = require("./number_range");

module.exports = (
  number,
  { baseMessageFn, title = "date", path, optional } = {}
) => {
  return numberRange(number, {
    lowerBound: 1,
    upperBound: 31,
    baseMessageFn,
    title,
    path,
    optional
  });
};
