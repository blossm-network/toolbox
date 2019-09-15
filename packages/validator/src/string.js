const { string: stringValidator } = require("@sustainers/validation");

const stringIsNotEmpty = require("./_string_is_not_empty");
const stringEmptyMessage = require("./_string_empty_message");
const stringTooLongMessage = require("./_string_too_long_message");

module.exports = (
  value,
  { fn, optional, title, maxLength, shouldAllowEmptyString = true } = {}
) => {
  const isWithinBounds = string =>
    maxLength == undefined || string.length <= maxLength;

  return stringValidator({
    value,
    fn: string => {
      return (
        (fn == undefined || fn(string)) &&
        (shouldAllowEmptyString || stringIsNotEmpty(string)) &&
        isWithinBounds(string)
      );
    },
    message: string => {
      if (!optional && !stringIsNotEmpty(string)) {
        return stringEmptyMessage(title);
      }
      if (!isWithinBounds(string)) {
        return stringTooLongMessage({
          title,
          max: maxLength
        });
      }
    },
    optional
  });
};
