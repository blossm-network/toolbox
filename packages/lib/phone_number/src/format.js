const { phone } = require("phone");
const libphonenumber = require("google-libphonenumber");

const phoneUtil = libphonenumber.PhoneNumberUtil.getInstance();
const PNF = libphonenumber.PhoneNumberFormat;

function defaultFormatter(number) {
  const { phoneNumber } = phone(number);
  return phoneNumber;
}

function backupFormatter(number) {
  try {
    const internationalizedPhonNumber = phoneUtil.parseAndKeepRawInput(
      `+${number}`
    );
    if (phoneUtil.isValidNumber(internationalizedPhonNumber)) {
      return phoneUtil.format(internationalizedPhonNumber, PNF.E164);
    }

    return null;
  } catch (err) {
    return null;
  }
}

module.exports = (number) => {
  const formattedNumber = defaultFormatter(number);
  if (formattedNumber != null) return formattedNumber;
  return backupFormatter(number);
};
