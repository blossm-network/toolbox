const deps = require("./deps");

module.exports = ({ procedure, service }) =>
  deps.hash(procedure.join("") + service).toString();
