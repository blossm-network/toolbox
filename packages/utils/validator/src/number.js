const { number: numberValidator } = require("@sustainer-network/validation");

module.exports = (number, { fn, optional } = {}) => {
  return numberValidator({
    value: number,
    optional,
    fn
  });
};
