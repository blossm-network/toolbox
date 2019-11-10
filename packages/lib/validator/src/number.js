const { number: numberValidator } = require("@blossm/validation");

module.exports = (number, { fn, optional } = {}) => {
  return numberValidator({
    value: number,
    optional,
    fn
  });
};
