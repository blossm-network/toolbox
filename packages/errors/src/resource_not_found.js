const { ResourceNotFoundError } = require("restify-errors");

const toJSON = require("./_to_json");

module.exports = {
  root: ({ cause, info } = {}) =>
    new ResourceNotFoundError(
      { cause, info, toJSON },
      "This root wasn't found."
    ),
  view: ({ cause, info } = {}) =>
    new ResourceNotFoundError(
      { cause, info, toJSON },
      "This view wasn't found."
    ),
  message: (message, { cause, info } = {}) =>
    new ResourceNotFoundError({ cause, info, toJSON }, message),
};
