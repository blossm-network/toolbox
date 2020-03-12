const deps = require("./deps");

module.exports = (...operation) => {
  //TODO
  // eslint-disable-next-line no-console
  console.log({ operationHash: operation });
  return deps.hash(operation.join("")).toString();
};
