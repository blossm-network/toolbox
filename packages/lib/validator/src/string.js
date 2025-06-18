import { string as stringValidator } from "@blossm/validation";

import stringIsNotEmpty from "./_string_is_not_empty.js";
import stringEmptyMessage from "./_string_empty_message.js";
import stringTooLongMessage from "./_string_too_long_message.js";

export default (
  value,
  { fn, optional, title, path, maxLength, shouldAllowEmptyString = true } = {}
) => {
  const isWithinBounds = (string) =>
    maxLength == undefined || string.length <= maxLength;

  return stringValidator({
    value,
    title,
    path,
    refinementFn: (string) =>
      (fn == undefined || fn(string)) &&
      (shouldAllowEmptyString || stringIsNotEmpty(string)) &&
      isWithinBounds(string),
    refinementMessageFn: (value, title) => {
      if (!optional && !stringIsNotEmpty(value)) {
        return stringEmptyMessage(title);
      }
      if (!isWithinBounds(value)) {
        return stringTooLongMessage({
          title,
          max: maxLength,
        });
      }
    },
    optional,
  });
};
