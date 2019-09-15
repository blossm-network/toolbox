const numberRange = require("./number_range");

module.exports = (number, { optional } = {}) => {
  return numberRange(number, {
    lowerBound: 1950,
    upperBound: 2100,
    title: "Year",
    optional
  });
};
