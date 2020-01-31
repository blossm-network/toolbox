const { format } = require("@blossm/phone-number");

module.exports = payload => {
  return {
    phone: format(payload.phone)
  };
};
