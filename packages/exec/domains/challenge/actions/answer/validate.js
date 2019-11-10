const { findError, string } = require("@blossm/validator");

const deps = require("./deps");

module.exports = payload => {
  const userInputError = findError([string(payload.code)]);
  if (userInputError) throw deps.conflictError.message(userInputError.message);
};
