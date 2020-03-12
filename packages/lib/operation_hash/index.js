const deps = require("./deps");

module.exports = (...operation) => {
  //TODO
  //eslint-disable-next-line
  console.log({ operation });

  return deps.hash(operation.join("")).toString();
};
