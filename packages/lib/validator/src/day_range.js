const numberRange = require("./number_range");

module.exports = (number, { optional } = {}) => {
  return numberRange(number, {
    lowerBound: 0,
    upperBound: 6,
    title: "Day",
    optional
  });
};
