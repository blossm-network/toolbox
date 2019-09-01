const { number: numberValidator } = require("@sustainers/validation");

module.exports = (number, { fn, optional } = {}) => {
  return numberValidator({
    value: number,
    optional,
    fn
  });
};
