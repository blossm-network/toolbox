const { object, string, date, findError } = require("@sustainers/validator");
const { badRequest } = require("@sustainers/errors");
const { fineTimestamp } = require("@sustainers/datetime");
const { SECONDS_IN_DAY } = require("@sustainers/duration-consts");

module.exports = async params => {
  const systemInputError = findError([
    object(params.headers),
    object(params.payload, { optional: true })
  ]);

  if (systemInputError) {
    throw badRequest.message(systemInputError.message);
  }

  const headersSystemInputError = findError([
    string(params.headers.trace, { optional: true }),
    object(params.headers.source, { optional: true }),
    date(params.headers.issued)
  ]);

  if (headersSystemInputError) {
    throw badRequest.message(headersSystemInputError.message);
  }

  if (
    fineTimestamp() < params.headers.issued ||
    fineTimestamp() - params.headers.issued > SECONDS_IN_DAY * 1000
  ) {
    throw badRequest.message("The issued timestamp seems incorrect.");
  }
};
