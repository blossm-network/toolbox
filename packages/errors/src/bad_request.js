const { BadRequestError } = require("restify-errors");

const toJSON = require("./_to_json");

module.exports = {
  missingId: ({ cause, info } = {}) =>
    new BadRequestError({ cause, info, toJSON }, "Missing id url parameter."),
  missingRoot: ({ cause, info } = {}) =>
    new BadRequestError({ cause, info, toJSON }, "Missing root url parameter."),
  missingMessage: ({ cause, info } = {}) =>
    new BadRequestError(
      { cause, info, toJSON },
      "No Pub/Sub message received."
    ),
  sessionTerminated: ({ cause, info } = {}) =>
    new BadRequestError({ cause, info, toJSON }, `This session is terminated.`),
  sessionAlreadyTerminated: ({ cause, info } = {}) =>
    new BadRequestError(
      { cause, info, toJSON },
      `This session has already been terminated.`
    ),
  sessionAlreadyUpgraded: ({ cause, info } = {}) =>
    new BadRequestError(
      { cause, info, toJSON },
      `This session has already been upgraded.`
    ),
  eventHandlerNotSpecified: ({ cause, info } = {}) =>
    new BadRequestError(
      { cause, info, toJSON },
      `Event handler not specified.`
    ),
  incompleteQuery: ({ cause, info } = {}) =>
    new BadRequestError(
      { cause, info, toJSON },
      `The query is missing a key or value.`
    ),
  badMessage: ({ cause, info } = {}) =>
    new BadRequestError(
      { cause, info, toJSON },
      "Invalid Pub/Sub message format."
    ),
  badEvent: ({ cause, info } = {}) =>
    new BadRequestError({ cause, info, toJSON }, "Invalid event format."),
  wrongEventStore: ({ cause, info } = {}) =>
    new BadRequestError(
      { cause, info, toJSON },
      "This event store can't accept this event."
    ),
  message: (message, { cause, info } = {}) =>
    new BadRequestError({ cause, info, toJSON }, message)
};
