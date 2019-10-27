const { format } = require("@sustainers/phone-number");

module.exports = async payload => {
  return {
    phone: format(payload.phone)
  };
};
