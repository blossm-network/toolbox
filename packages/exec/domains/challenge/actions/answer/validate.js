const { findError, string } = require("@blossm/validator");

module.exports = payload => {
  const error = findError([string(payload.code, { title: "code" })]);
  if (error) throw error;
};
