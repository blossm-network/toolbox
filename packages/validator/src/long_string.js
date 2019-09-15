const { string: stringValidator } = require("@sustainers/validation");
const stringTooLongMessage = require("./_string_too_long_message");
const stringIsNotEmpty = require("./_string_is_not_empty");
const stringEmptyMessage = require("./_string_empty_message");

const maxLongStringLength = 750;

let isLongString = string => {
  return string.length <= maxLongStringLength;
};

module.exports = (value, title, { optional } = {}) => {
  return stringValidator({
    value,
    fn: string =>
      (optional || stringIsNotEmpty(string)) && isLongString(string),
    message: string => {
      if (!optional && !stringIsNotEmpty(string)) {
        return stringEmptyMessage(title);
      }
      if (!isLongString(string)) {
        return stringTooLongMessage({
          title,
          max: maxLongStringLength
        });
      }
    },
    optional
  });
};
