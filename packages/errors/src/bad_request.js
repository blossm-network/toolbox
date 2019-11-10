const { BadRequestError } = require("restify-errors");

module.exports = {
  missingId: () => new BadRequestError("Missing id url parameter"),
  rootNotFound: () => new BadRequestError("Missing id url parameter"),
  missingMessage: () => new BadRequestError("No Pub/Sub message received"),
  badMessage: () => new BadRequestError("Invalid Pub/Sub message format"),
  badEvent: () => new BadRequestError("Invalid event format"),
  message: message => new BadRequestError(message)
};
