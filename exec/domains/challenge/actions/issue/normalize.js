const { format } = require("@blossm/phone-number");

module.exports = async payload => {
  return {
    phone: format(payload.phone)
  };
};
