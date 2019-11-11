const numberRange = require("./number_range");

module.exports = (number, { baseMessageFn, title = "date", optional } = {}) => {
  return numberRange(number, {
    lowerBound: 1,
    upperBound: 31,
    baseMessageFn,
    title,
    optional
  });
};
