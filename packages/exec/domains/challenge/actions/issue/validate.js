const { findError, phoneNumber } = require("@blossm/validator");

const deps = require("./deps");

module.exports = payload => {
  const error = findError([
    phoneNumber(payload.phone, { title: "phone number" })
  ]);
  if (error) throw deps.badRequestError.message(error.message);
};
