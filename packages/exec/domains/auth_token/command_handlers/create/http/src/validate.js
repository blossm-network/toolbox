const {
  findError,
  stringArray,
  object,
  string
} = require("@sustainer-network/validator");

const { badRequest } = require("@sustainer-network/errors");

module.exports = async params => {
  const systemInputError = findError([
    stringArray(params.payload.audiences),
    object(params.payload.metadata),
    string(params.payload.subject)
  ]);

  if (systemInputError) throw badRequest.message(systemInputError.message);
};
