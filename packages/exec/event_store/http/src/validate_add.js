const {
  findError,
  object,
  string,
  number
} = require("@sustainer-network/validator");
const { badRequest } = require("@sustainer-network/errors");

module.exports = async body => {
  const systemInputError = findError([
    string(body.storeId, { shouldAllowEmptyString: false }),
    object(body.event)
  ]);

  if (systemInputError) throw badRequest.message(systemInputError.message);

  const eventSystemInputError = findError([
    object(body.event.fact),
    object(body.event.payload)
  ]);

  if (eventSystemInputError)
    throw badRequest.message(eventSystemInputError.message);

  const eventFactSystemInputError = findError([
    string(body.event.fact.root),
    string(body.event.fact.topic),
    number(body.event.fact.version),
    string(body.event.fact.commandInstanceId),
    string(body.event.fact.command),
    number(body.event.fact.commandIssuedTimestamp),
    string(body.event.fact.traceId, { optional: true }),
    number(body.event.fact.createdTimestamp)
  ]);

  if (eventFactSystemInputError)
    throw badRequest.message(eventFactSystemInputError.message);
};
