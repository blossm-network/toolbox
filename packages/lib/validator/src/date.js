const { string: stringValidator } = require("@sustainers/validation");
const findError = require("./find_error");
const number = require("./number");

module.exports = (value, { optional } = {}) => {
  return stringValidator({
    value,
    message: () =>
      "This date couldn't be parsed. Try again after making a change to it.",
    fn: value => {
      const nameErr = findError([number(Date.parse(value))]);
      return nameErr == undefined;
    },
    optional
  });
};
