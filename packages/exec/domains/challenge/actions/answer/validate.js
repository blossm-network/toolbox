const { findError, string } = require("@blossm/validator");

const deps = require("./deps");

module.exports = payload => {
  const error = findError([string(payload.code, { title: "code" })]);
  if (error) throw deps.badRequestError.message(error.message);
};
