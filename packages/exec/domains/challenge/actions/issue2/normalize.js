const { format } = require("@sustainers/phone-number");

module.exports = payload => {
  return {
    phone: format(payload.phone)
  };
};
