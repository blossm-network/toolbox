const { ConflictError } = require("restify-errors");

module.exports = {
  phoneNotRecognized: new ConflictError("This phone number isn't recognized."),
  codeNotRecognized: new ConflictError("This code isn't recognized."),
  codeExpired: new ConflictError("This code expired."),
  wrongCode: new ConflictError("This code isn't right."),
  message: message => new ConflictError(message)
};
