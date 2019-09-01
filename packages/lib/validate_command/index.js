const { object, string, number, findError } = require("@sustainers/validator");
const { badRequest, conflict } = require("@sustainers/errors");
const { fineTimestamp } = require("@sustainers/datetime");
const { SECONDS_IN_DAY } = require("@sustainers/consts");

module.exports = async params => {
  const systemInputError = findError([
    object(params.issuerInfo, { optional: true }),
    string(params.traceId, { optional: true }),
    number(params.issuedTimestamp)
  ]);

  if (systemInputError) {
    throw badRequest.message(systemInputError.message);
  }

  if (
    fineTimestamp() < params.issuedTimestamp ||
    fineTimestamp() - params.issuedTimestamp > SECONDS_IN_DAY * 1000
  ) {
    throw badRequest.message("The issuedTimestamp seems incorrect.");
  }

  if (params.issuerInfo != undefined) {
    const issuerInfoSystemInputError = findError([
      string(params.issuerInfo.id),
      string(params.issuerInfo.ip)
    ]);

    if (issuerInfoSystemInputError) {
      throw badRequest.message(issuerInfoSystemInputError.message);
    }
  }

  const userInputError = findError([
    object(params.payload, { optional: true })
  ]);

  if (userInputError) throw conflict.message(userInputError.message);
};
