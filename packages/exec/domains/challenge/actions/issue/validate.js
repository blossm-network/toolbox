const { findError, phoneNumber } = require("@blossm/validator");

const deps = require("./deps");

module.exports = payload => {
  const userInputError = findError([phoneNumber(payload.phone)]);
  if (userInputError) throw deps.conflictError.message(userInputError.message);
};
