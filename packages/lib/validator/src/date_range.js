const numberRange = require("./number_range");

module.exports = (number, { optional } = {}) => {
  return numberRange(number, {
    lowerBound: 1,
    upperBound: 31,
    title: "Date",
    optional
  });
};
