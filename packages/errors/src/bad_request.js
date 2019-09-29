const { BadRequestError } = require("restify-errors");

module.exports = {
  missingId: new BadRequestError("Missing id url parameter."),
  rootNotFound: new BadRequestError("Missing id url parameter."),
  message: message => new BadRequestError(message)
};
