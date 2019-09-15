const { string: stringValidator } = require("@sustainers/validation");
const stringTooLongMessage = require("./_string_too_long_message");
const stringIsNotEmpty = require("./_string_is_not_empty");
const stringEmptyMessage = require("./_string_empty_message");

const maxMediumStringLength = 50;

let isMediumString = string => {
  return string.length <= maxMediumStringLength;
};

module.exports = (value, title, { optional } = {}) => {
  return stringValidator({
    value,
    fn: string =>
      (optional || stringIsNotEmpty(string)) && isMediumString(string),
    message: string => {
      if (!optional && !stringIsNotEmpty(string)) {
        return stringEmptyMessage(title);
      }
      if (!isMediumString(string)) {
        return stringTooLongMessage({
          title,
          max: maxMediumStringLength
        });
      }
    },
    optional
  });
};
