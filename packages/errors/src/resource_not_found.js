const { ResourceNotFoundError } = require("restify-errors");

const toJSON = require("./_to_json");

module.exports = {
  root: ({ cause, info } = {}) =>
    new ResourceNotFoundError(
      { cause, info, toJSON },
      "This root wasn't found."
    ),
  viewId: ({ cause, info } = {}) =>
    new ResourceNotFoundError(
      { cause, info, toJSON },
      "This view ID wasn't found."
    ),
  message: (message, { cause, info } = {}) =>
    new ResourceNotFoundError({ cause, info, toJSON }, message)
};
