const { string: stringValidator } = require("@sustainer-network/validation");

const regex = /^[+-]?([0-9]*[.])?[0-9]+$/;

module.exports = (value, { optional } = {}) => {
  return stringValidator({
    value,
    fn: numeric => regex.test(numeric),
    message: numeric => {
      return `${numeric} should be a number.`;
    },
    optional
  });
};
