const { BadRequestError } = require("restify-errors");

module.exports = {
  missingId: new BadRequestError("Missing id url parameter."),
  message: message => new BadRequestError(message)
};
