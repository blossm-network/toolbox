const {
  findError,
  objectArray,
  object,
  string
} = require("@sustainer-network/validator");

const { badRequest } = require("@sustainer-network/errors");

module.exports = async params => {
  const systemInputError = findError([
    objectArray(params.payload.audience, { optional: true }),
    object(params.payload.metadata),
    string(params.payload.issuer),
    string(params.payload.subject)
  ]);

  if (systemInputError) throw badRequest.message(systemInputError.message);

  for (const audience of params.payload.audience) {
    const audienceSystemInputError = findError([
      string(audience.service),
      string(audience.domain),
      string(audience.scope),
      string(audience.root)
    ]);

    if (audienceSystemInputError)
      throw badRequest.message(audienceSystemInputError.message);
  }
};
