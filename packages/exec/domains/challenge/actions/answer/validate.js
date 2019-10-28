const { findError, string } = require("@sustainers/validator");
const { conflict } = require("@sustainers/errors");

module.exports = payload => {
  const userInputError = findError([string(payload.code)]);
  if (userInputError) throw conflict.message(userInputError.message);
};
