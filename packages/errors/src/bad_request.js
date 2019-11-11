const { BadRequestError } = require("restify-errors");

module.exports = {
  missingId: () => new BadRequestError("Missing id url parameter."),
  missingMessage: () => new BadRequestError("No Pub/Sub message received."),
  badMessage: () => new BadRequestError("Invalid Pub/Sub message format."),
  badEvent: () => new BadRequestError("Invalid event format."),
  phoneNotRecognized: () =>
    new BadRequestError("This phone number isn't recognized."),
  codeNotRecognized: () => new BadRequestError("This code isn't recognized."),
  codeExpired: () => new BadRequestError("This code expired."),
  wrongCode: () => new BadRequestError("This code isn't right."),
  message: message => new BadRequestError(message)
};
