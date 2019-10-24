const { ConflictError } = require("restify-errors");

module.exports = {
  phoneNotRecognized: new ConflictError("This phone number isn't recognized."),
  message: message => new ConflictError(message)
};
