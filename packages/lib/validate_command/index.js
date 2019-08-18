const {
  object,
  string,
  number,
  findError
} = require("@sustainer-network/validator");
const { badRequest, conflict } = require("@sustainer-network/errors");
const { fineTimestamp } = require("@sustainer-network/datetime");
const { SECONDS_IN_DAY } = require("@sustainer-network/consts");

module.exports = async body => {
  const systemInputError = findError([
    object(body.issuerInfo),
    string(body.traceId, { optional: true }),
    string(body.name, { optional: true }),
    number(body.issuedTimestamp)
  ]);

  if (systemInputError) {
    throw badRequest.message(systemInputError.message);
  }

  if (
    fineTimestamp() < body.issuedTimestamp ||
    fineTimestamp() - body.issuedTimestamp > SECONDS_IN_DAY * 1000
  ) {
    throw badRequest.message("The issuedTimestamp seems incorrect.");
  }

  const issuerInfoSystemInputError = findError([
    string(body.issuerInfo.id),
    string(body.issuerInfo.ip)
  ]);

  if (issuerInfoSystemInputError) {
    throw badRequest.message(issuerInfoSystemInputError.message);
  }

  const userInputError = findError([object(body.payload, { optional: true })]);

  if (userInputError) throw conflict.message(userInputError.message);
};
