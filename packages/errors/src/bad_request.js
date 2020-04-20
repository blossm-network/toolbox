const { BadRequestError } = require("restify-errors");

const toJSON = require("./_to_json");

module.exports = {
  message: (message, { cause, info } = {}) =>
    new BadRequestError({ cause, info, toJSON }, message),
};
