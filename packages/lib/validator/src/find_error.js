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
      //TODO
      //eslint-disable-next-line no-console
      console.log({ json });
      if (!json.errors) continue;
      //TODO
      //eslint-disable-next-line no-console
      console.log({ jsonErrors: json.errors });
      errors.push(
        ...json.errors.map(error => {
          return {
            message: error.message,
            path: error.path
          };
        })
      );
      //TODO
      //eslint-disable-next-line no-console
      console.log({ errors });
    }
  }
  return errors;
};

module.exports = results => {
  //TODO
  //eslint-disable-next-line no-console
  console.log({ results });
  const errors = getErrors(results);

  //TODO
  //eslint-disable-next-line no-console
  console.log({ finalErrors: errors });

  if (!errors.length) return null;

  return deps.invalidArgumentError.validationFailed({
    info: {
      errors: errors.map(e => {
        //TODO
        //eslint-disable-next-line no-console
        console.log({ e });
        return { message: e.message, path: e.path[0] };
      })
    }
  });
};
