const { findError, string } = require("@blossm/validator");

module.exports = payload => {
  const error = findError([
    string(payload.code, { title: "code", path: "payload.code" })
  ]);
  if (error) throw error;
};
