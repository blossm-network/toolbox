const deps = require("../deps");

const getErrors = results => {
  const errors = [];
  for (const result of results) {
    if (result == undefined) {
      continue;
    } else if (result.isValid) {
      if (!result.isValid()) errors.push(...result.errors);
    }
  }
  return errors;
};

module.exports = results => {
  const errors = getErrors(results);

  if (!errors.length) return null;

  return deps.invalidArgumentError.validationFailed({ info: { errors } });
};
