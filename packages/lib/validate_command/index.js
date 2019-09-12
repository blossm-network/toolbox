const { object, string, number, findError } = require("@sustainers/validator");
const { badRequest } = require("@sustainers/errors");
const { fineTimestamp } = require("@sustainers/datetime");
const { SECONDS_IN_DAY } = require("@sustainers/consts");

module.exports = async params => {
  const systemInputError = findError([
    object(params.header),
    object(params.payload, { optional: true })
  ]);

  if (systemInputError) {
    throw badRequest.message(systemInputError.message);
  }

  const headerSystemInputError = findError([
    string(params.header.trace, { optional: true }),
    object(params.header.source, { optional: true }),
    number(params.header.issued)
  ]);

  if (headerSystemInputError) {
    throw badRequest.message(headerSystemInputError.message);
  }

  if (
    fineTimestamp() < params.header.issued ||
    fineTimestamp() - params.header.issued > SECONDS_IN_DAY * 1000
  ) {
    throw badRequest.message("The issued timestamp seems incorrect.");
  }
};
