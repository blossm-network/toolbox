const { BadRequestError } = require("restify-errors");

module.exports = {
  message: message => new BadRequestError(message)
};
