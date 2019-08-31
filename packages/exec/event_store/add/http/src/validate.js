const {
  findError,
  object,
  string,
  number
} = require("@sustainer-network/validator");
const { badRequest } = require("@sustainer-network/errors");

module.exports = async params => {
  const systemInputError = findError([
    string(params.domain, { shouldAllowEmptyString: false }),
    string(params.service, { shouldAllowEmptyString: false }),
    object(params.event)
  ]);

  if (systemInputError) throw badRequest.message(systemInputError.message);

  const eventSystemInputError = findError([
    object(params.event.context),
    object(params.event.fact),
    object(params.event.payload)
  ]);

  if (eventSystemInputError)
    throw badRequest.message(eventSystemInputError.message);

  const eventFactSystemInputError = findError([
    string(params.event.fact.root),
    string(params.event.fact.topic),
    number(params.event.fact.version),
    object(params.event.fact.command),
    string(params.event.fact.traceId, { optional: true }),
    number(params.event.fact.createdTimestamp)
  ]);

  if (eventFactSystemInputError)
    throw badRequest.message(eventFactSystemInputError.message);

  const eventCommandFactSystemInputError = findError([
    string(params.event.fact.command.id),
    string(params.event.fact.command.action),
    string(params.event.fact.command.domain),
    string(params.event.fact.command.service),
    number(params.event.fact.command.issuedTimestamp)
  ]);

  if (eventCommandFactSystemInputError)
    throw badRequest.message(eventCommandFactSystemInputError.message);
};
