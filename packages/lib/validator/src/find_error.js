const deps = require("../deps");

const getErrors = results => {
  const errors = [];
  for (const result of results) {
    if (result == undefined) {
      continue;
    } else if (result.isValid) {
      if (!result.isValid()) errors.push(...result.errors);
    } else if (result.toJSON) {
      const json = result.toJSON();
      if (!json.errors) continue;
      for (const error of json.errors) {
        errors.push({
          message: error.message,
          path: error.path
        });
      }
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
