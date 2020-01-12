const { PreconditionFailedError } = require("restify-errors");

const toJSON = require("./_to_json");

module.exports = {
  eventNumberIncorrect: ({ cause, info } = {}) =>
    new PreconditionFailedError(
      { cause, info, toJSON },
      "Event number incorrect."
    ),
  eventNumberDuplicate: ({ cause, info } = {}) =>
    new PreconditionFailedError(
      { cause, info, toJSON },
      "Event number duplicate."
    ),
  message: (message, { cause, info } = {}) =>
    new PreconditionFailedError({ cause, info, toJSON }, message)
};
