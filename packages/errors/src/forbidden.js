const { ForbiddenError } = require("restify-errors");

const toJSON = require("./_to_json");

module.exports = {
  message: (message, { cause, info } = {}) =>
    new ForbiddenError({ cause, info, toJSON }, message),
};
