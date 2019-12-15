const { findError, phoneNumber } = require("@blossm/validator");

module.exports = payload => {
  const error = findError([
    phoneNumber(payload.phone, { title: "phone number", path: "payload.phone" })
  ]);
  if (error) throw error;
};
