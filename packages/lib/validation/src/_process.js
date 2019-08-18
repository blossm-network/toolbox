const { maybe, validate } = require("tcomb-validation");

let process = (val, filter, optional) => {
  if (optional) return process(val, maybe(filter));
  return validate(val, filter);
};

module.exports = process;
