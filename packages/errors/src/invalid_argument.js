const { InvalidArgumentError } = require("restify-errors");

const toJSON = require("./_to_json");

module.exports = {
  phoneNotRecognized: ({ cause, info } = {}) =>
    new InvalidArgumentError(
      { cause, info, toJSON },
      "This phone number isn't recognized."
    ),
  codeExpired: ({ cause, info } = {}) =>
    new InvalidArgumentError({ cause, info, toJSON }, "This code expired."),
  wrongCode: ({ cause, info } = {}) =>
    new InvalidArgumentError({ cause, info, toJSON }, "This code isn't right."),
  validationFailed: ({ cause, info } = {}) =>
    new InvalidArgumentError(
      { cause, info, toJSON },
      "Some information is invalid."
    ),
  message: (message, { cause, info } = {}) =>
    new InvalidArgumentError({ cause, info, toJSON }, message),
};
