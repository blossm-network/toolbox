const deps = require("./deps");

module.exports = (...operation) => {
  const hash = deps.hash(operation.join("")).toString();
  //TODO
  console.log({ hash, operation });
  return hash;
};
