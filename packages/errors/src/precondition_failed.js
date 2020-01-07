const { PreconditionFailedError } = require("restify-errors");

const toJSON = require("./_to_json");

module.exports = {
  eventNumberIncorrect: ({ cause, info } = {}) =>
    new PreconditionFailedError(
      { cause, info, toJSON },
      "Event number incorrect."
    ),
  message: (message, { cause, info } = {}) =>
    new PreconditionFailedError({ cause, info, toJSON }, message)
};
