const { InternalServerError } = require("restify-errors");

const toJSON = require("./_to_json");

module.exports = {
  message: (message, { cause, info } = {}) =>
    new InternalServerError({ cause, info, toJSON }, message),
};
