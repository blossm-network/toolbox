const deps = require("./deps");

module.exports = ({ operation, service }) =>
  deps.hash(operation.join("") + service).toString();
