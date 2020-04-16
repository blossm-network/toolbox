const { ForbiddenError } = require("restify-errors");

const toJSON = require("./_to_json");

module.exports = {
  wrongContext: ({ cause, info } = {}) =>
    new ForbiddenError(
      { cause, info, toJSON },
      "Missing required permissions."
    ),
  message: (message, { cause, info } = {}) =>
    new ForbiddenError({ cause, info, toJSON }, message)
};
