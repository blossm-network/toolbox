const { UnauthorizedError } = require("restify-errors");

const toJSON = require("./_to_json");

module.exports = {
  cors: ({ cause, info } = {}) =>
    new UnauthorizedError({ cause, info, toJSON }, "Not allowed by CORS."),
  message: (message, { cause, info } = {}) =>
    new UnauthorizedError({ cause, info, toJSON }, message),
};
