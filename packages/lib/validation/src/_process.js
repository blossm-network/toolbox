const { maybe, validate } = require("tcomb-validation");

let process = (val, filter, context = {}, optional) => {
  if (optional) return process(val, maybe(filter), { context });
  return validate(val, filter, { context });
};

module.exports = process;
