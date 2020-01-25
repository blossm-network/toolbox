const { UnauthorizedError } = require("restify-errors");

const toJSON = require("./_to_json");

module.exports = {
  cors: ({ cause, info } = {}) =>
    new UnauthorizedError({ cause, info, toJSON }, "Not allowed by CORS."),
  context: ({ cause, info } = {}) =>
    new UnauthorizedError(
      { cause, info, toJSON },
      "This context isn't accessible."
    ),
  message: (message, { cause, info } = {}) =>
    new UnauthorizedError({ cause, info, toJSON }, message)
};
