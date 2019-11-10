const { InternalServerError } = require("restify-errors");

module.exports = {
  message: message => new InternalServerError(message)
};
