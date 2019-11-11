const { maybe, validate } = require("tcomb-validation");

let process = (val, filter, { context = {}, path, optional }) => {
  if (optional) return process(val, maybe(filter), { context, path });
  return validate(val, filter, { context, path });
};

module.exports = process;
