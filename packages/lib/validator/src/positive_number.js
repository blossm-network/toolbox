const numberRange = require("./number_range");

module.exports = (number, { optional } = {}) => {
  return numberRange(number, {
    lowerBound: 0,
    upperBound: 1000000,
    title: "Number",
    optional
  });
};
