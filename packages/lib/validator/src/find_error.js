const deps = require("../deps");

const getErrors = results => {
  const errors = [];
  for (const result of results) {
    if (result == undefined) {
      continue;
    } else if (result.isValid) {
      if (!result.isValid()) errors.push(...result.errors);
    } else {
      errors.push(result);
    }
  }
  return errors;
};

module.exports = results => {
  const errors = getErrors(results);

  if (!errors.length) return null;

  return deps.invalidArgumentError.validationFailed({
    info: {
      errors: errors.map(e => {
        return { message: e.message, path: e.path[0] };
      })
    }
  });
};
