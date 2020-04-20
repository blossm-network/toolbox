const { BadRequestError } = require("restify-errors");

const toJSON = require("./_to_json");

module.exports = {
  missingRoot: ({ cause, info } = {}) =>
    new BadRequestError({ cause, info, toJSON }, "Missing root url parameter."),
  message: (message, { cause, info } = {}) =>
    new BadRequestError({ cause, info, toJSON }, message),
};
