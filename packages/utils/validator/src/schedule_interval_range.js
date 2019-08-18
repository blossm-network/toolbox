const maxAllowedInterval = 10;

const numberRange = require("./number_range");

module.exports = (number, { optional } = {}) => {
  return numberRange(number, {
    lowerBound: 0,
    upperBound: maxAllowedInterval,
    title: "Interval",
    optional
  });
};
