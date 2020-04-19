const { InvalidArgumentError } = require("restify-errors");

const toJSON = require("./_to_json");

module.exports = {
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
