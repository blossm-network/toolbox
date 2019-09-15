const { number: numberValidator } = require("@sustainers/validation");
const doNumbersEqual = require("./_do_numbers_equal");

module.exports = (number1, number2) => {
  return numberValidator({
    value: number1,
    message: value => `${value} does not equal ${number2}`,
    fn: number => doNumbersEqual(number, number2)
  });
};
