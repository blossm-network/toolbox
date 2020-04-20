const deps = require("../deps");

const getErrors = (results) => {
  const errors = [];
  for (const result of results) {
    if (result == undefined) {
      continue;
    } else if (result.isValid) {
      if (!result.isValid()) errors.push(...result.errors);
    } else if (result.toJSON) {
      const json = result.toJSON();
      errors.push(
        ...json.info.errors.map((error) => {
          return {
            message: error.message,
            path: error.path,
          };
        })
      );
    }
  }
  return errors;
};

module.exports = (results) => {
  const errors = getErrors(results);

  if (!errors.length) return null;

  return deps.invalidArgumentError.message("Some information is invalid.", {
    info: {
      errors: errors.map((e) => {
        return { message: e.message, path: e.path[0] };
      }),
    },
  });
};
