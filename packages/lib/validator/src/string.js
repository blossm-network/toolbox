const { string: stringValidator } = require("@blossm/validation");

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
    title,
    refinementFn: string => {
      return (
        (fn == undefined || fn(string)) &&
        (shouldAllowEmptyString || stringIsNotEmpty(string)) &&
        isWithinBounds(string)
      );
    },
    refinementMessageFn: (value, title) => {
      if (!optional && !stringIsNotEmpty(value)) {
        return stringEmptyMessage(title);
      }
      if (!isWithinBounds(value)) {
        return stringTooLongMessage({
          title,
          max: maxLength
        });
      }
    },
    optional
  });
};
