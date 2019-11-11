const { BadRequestError } = require("restify-errors");

const toJSON = require("./_to_json");

module.exports = {
  missingId: ({ cause, info } = {}) =>
    new BadRequestError({ cause, info, toJSON }, "Missing id url parameter."),
  missingMessage: ({ cause, info } = {}) =>
    new BadRequestError(
      { cause, info, toJSON },
      "No Pub/Sub message received."
    ),
  badMessage: ({ cause, info } = {}) =>
    new BadRequestError(
      { cause, info, toJSON },
      "Invalid Pub/Sub message format."
    ),
  badEvent: ({ cause, info } = {}) =>
    new BadRequestError({ cause, info, toJSON }, "Invalid event format."),
  message: (message, { cause, info } = {}) =>
    new BadRequestError({ cause, info, toJSON }, message)
};
