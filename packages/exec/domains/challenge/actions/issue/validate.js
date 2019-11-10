const { findError, phoneNumber } = require("@blossm/validator");
const { conflict } = require("@blossm/errors");

module.exports = payload => {
  const userInputError = findError([phoneNumber(payload.phone)]);
  if (userInputError) throw conflict.message(userInputError.message);
};
