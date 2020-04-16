const { string: stringValidator } = require("@blossm/validation");

const maxPasswordLength = 30;
const minPasswordLength = 8;

let isLongEnough = (string) => {
  return string.length >= minPasswordLength;
};

let isShortEnough = (string) => {
  return string.length <= maxPasswordLength;
};

let hasAcceptableSymbol = (string) => {
  /* eslint-disable no-useless-escape */
  return (
    string.search(/[\!\@\#\$\%\^\&\*\(\)\_\+\-\?\>\<\,\.\/\|\]\[\}\{\]\~]/) > -1
  );
  /* eslint-enable no-useless-escape */
};

let hasUnsupportedChar = (string) => {
  /* eslint-disable no-useless-escape */
  return (
    string.search(
      /[^a-zA-Z0-9\!\@\#\$\%\^\&\*\(\)\_\+\-\?\>\<\,\.\/\|\]\[\}\{\]\~]/
    ) != -1
  );
  /* eslint-enable no-useless-escape */
};

let hasNumber = (string) => {
  return string.search(/\d/) > -1;
};

let hasLetter = (string) => {
  return string.search(/[a-zA-Z]/) > -1;
};

let isFormattedCorrectly = (string) => {
  return (
    hasNumber(string) &&
    hasLetter(string) &&
    hasAcceptableSymbol(string) &&
    !hasUnsupportedChar(string)
  );
};

module.exports = (
  value,
  { baseMessageFn, title = "password", path, optional } = {}
) =>
  stringValidator({
    value,
    title,
    path,
    baseMessageFn,
    refinementFn: (password) => {
      return (
        isLongEnough(password) &&
        isShortEnough(password) &&
        isFormattedCorrectly(password)
      );
    },
    refinementMessageFn: (password, title) => {
      if (!isLongEnough(password)) {
        return `This ${title} should be more than ${minPasswordLength} characters. Add some characters to make it more secure.`;
      }
      if (!isShortEnough(password)) {
        return `This ${title} should be less than ${maxPasswordLength} characters. Give this another try after cutting some characters.`;
      }
      if (!isFormattedCorrectly(password)) {
        return `This ${password} should have a number, letter, and symbol. It’s safer that way.`;
      }
    },
    optional,
  });
