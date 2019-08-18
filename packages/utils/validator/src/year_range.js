const numberRange = require("./number_range");

module.exports = (number, { optional } = {}) => {
  return numberRange(number, {
    lowerBound: 2010,
    upperBound: 2040,
    title: "Year",
    optional
  });
};
