const { object, string, date, findError } = require("@blossm/validator");
const { badRequest } = require("@blossm/errors");
const { SECONDS_IN_DAY } = require("@blossm/duration-consts");

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
    string(params.headers.root, { optional: true }),
    object(params.headers.source, { optional: true }),
    date(params.headers.issued)
  ]);

  if (headersSystemInputError) {
    throw badRequest.message(headersSystemInputError.message);
  }

  if (
    new Date() < new Date(params.headers.issued) ||
    new Date().getTime() - new Date(params.headers.issued).getTime() >
      SECONDS_IN_DAY * 1000
  ) {
    throw badRequest.message("The issued timestamp seems incorrect.");
  }
};
