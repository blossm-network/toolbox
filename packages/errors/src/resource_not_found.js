const { ResourceNotFoundError } = require("restify-errors");

const toJSON = require("./_to_json");

module.exports = {
  root: ({ cause, info } = {}) =>
    new ResourceNotFoundError({ cause, info, toJSON }, "Root not found."),
  viewId: ({ cause, info } = {}) =>
    new ResourceNotFoundError({ cause, info, toJSON }, "View ID not found."),
  message: (message, { cause, info } = {}) =>
    new ResourceNotFoundError({ cause, info, toJSON }, message)
};
