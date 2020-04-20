const { InvalidArgumentError } = require("restify-errors");

const toJSON = require("./_to_json");

module.exports = {
  message: (message, { cause, info } = {}) =>
    new InvalidArgumentError({ cause, info, toJSON }, message),
};
