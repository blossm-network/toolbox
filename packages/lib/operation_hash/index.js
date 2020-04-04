const deps = require("./deps");

module.exports = (...operation) => {
  const hash = deps.hash(operation.join("")).toString();
  //TODO
  //eslint-disable-next-line no-console
  console.log({ operation, hash });
  return hash;
};
