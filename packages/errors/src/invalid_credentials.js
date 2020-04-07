const { InvalidCredentialsError } = require("restify-errors");

const toJSON = require("./_to_json");

module.exports = {
  tokenInvalid: ({ cause, info } = {}) =>
    new InvalidCredentialsError(
      { cause, info, toJSON },
      "This token is invalid."
    ),
  tokenExpired: ({ cause, info } = {}) =>
    new InvalidCredentialsError(
      { cause, info, toJSON },
      "This token is expired."
    ),
  tokenNotActive: ({ cause, info } = {}) =>
    new InvalidCredentialsError(
      { cause, info, toJSON },
      "This token is not active."
    ),
  tokenTerminated: ({ cause, info } = {}) =>
    new InvalidCredentialsError(
      { cause, info, toJSON },
      "This token has already been terminated."
    ),
  wrongAudience: ({ cause, info } = {}) =>
    new InvalidCredentialsError(
      { cause, info, toJSON },
      "This token isn't meant for this audience."
    ),
  phoneNotRecognized: ({ cause, info } = {}) =>
    new InvalidCredentialsError(
      { cause, info, toJSON },
      "This phone number isn't recognized."
    ),
  message: (message, { cause, info } = {}) =>
    new InvalidCredentialsError({ cause, info, toJSON }, message)
};
