const { string: stringValidator } = require("@sustainer-network/validation");
const stringTooLongMessage = require("./_string_too_long_message");
const stringIsNotEmpty = require("./_string_is_not_empty");
const stringEmptyMessage = require("./_string_empty_message");

const maxShortStringLength = 40;

let isShortString = string => {
  return string.length <= maxShortStringLength;
};

module.exports = (value, title, { optional } = {}) => {
  return stringValidator({
    value,
    fn: string =>
      (optional || stringIsNotEmpty(string)) && isShortString(string),
    message: string => {
      if (!optional && !stringIsNotEmpty(string)) {
        return stringEmptyMessage(title);
      }
      if (!isShortString(string)) {
        return stringTooLongMessage({
          title,
          max: maxShortStringLength
        });
      }
    },
    optional
  });
};
