const deps = require("./deps");

module.exports = (...operation) => {
  const hash = deps.hash(operation.join("")).toString();
  return hash;
};
