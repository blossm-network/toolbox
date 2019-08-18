const { ConflictError } = require("restify-errors");

module.exports = {
  message: message => new ConflictError(message)
};
