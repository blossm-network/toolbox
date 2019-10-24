const { InternalServerError } = require("restify-errors");
// const { stripIndents } = require("common-tags");

module.exports = {
  multiplePhonesFound: new InternalServerError(
    "Multiple phone numbers were found, and only one was expected."
  ),
  message: message => new InternalServerError(message)
};
