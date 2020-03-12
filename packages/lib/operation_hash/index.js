const deps = require("./deps");

module.exports = (...operation) => deps.hash(operation.join("")).toString();
