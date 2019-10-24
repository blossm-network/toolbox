const { findError, phoneNumber } = require("@sustainers/validator");
const { conflict } = require("@sustainers/errors");

module.exports = payload => {
  const userInputError = findError([phoneNumber(payload.phone)]);
  if (userInputError) throw conflict.message(userInputError.message);
};
