const { findError, string } = require("@blossm/validator");
const { conflict } = require("@blossm/errors");

module.exports = payload => {
  const userInputError = findError([string(payload.code)]);
  if (userInputError) throw conflict.message(userInputError.message);
};
