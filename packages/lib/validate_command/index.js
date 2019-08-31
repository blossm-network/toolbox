const {
  object,
  string,
  number,
  findError
} = require("@sustainer-network/validator");
const { badRequest, conflict } = require("@sustainer-network/errors");
const { fineTimestamp } = require("@sustainer-network/datetime");
const { SECONDS_IN_DAY } = require("@sustainer-network/consts");

module.exports = async params => {
  //eslint-disable-next-line no-console
  console.log("PARMA: ", params);
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
