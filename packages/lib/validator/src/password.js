const { string: stringValidator } = require("@blossm/validation");

const maxPasswordLength = 30;
const minPasswordLength = 8;

let isLongEnough = string => {
  return string.length >= minPasswordLength;
};

let isShortEnough = string => {
  return string.length <= maxPasswordLength;
};

let hasAcceptableSymbol = string => {
  return (
    string.search(/[\!\@\#\$\%\^\&\*\(\)\_\+\-\?\>\<\,\.\/\|\]\[\}\{\]\~]/) > -1
  );
};

let hasUnsupportedChar = string => {
  return (
    string.search(
      /[^a-zA-Z0-9\!\@\#\$\%\^\&\*\(\)\_\+\-\?\>\<\,\.\/\|\]\[\}\{\]\~]/
    ) != -1
  );
};

let hasNumber = string => {
  return string.search(/\d/) > -1;
};

let hasLetter = string => {
  return string.search(/[a-zA-Z]/) > -1;
};

let isFormattedCorrectly = string => {
  return (
    hasNumber(string) &&
    hasLetter(string) &&
    hasAcceptableSymbol(string) &&
    !hasUnsupportedChar(string)
  );
};

module.exports = (value, { optional } = {}) => {
  return stringValidator({
    value,
    fn: password => {
      return (
        isLongEnough(password) &&
        isShortEnough(password) &&
        isFormattedCorrectly(password)
      );
    },
    message: password => {
      if (!isLongEnough(password)) {
        return `Your password should be more than ${minPasswordLength} characters. Add some characters to make it more secure.`;
      }
      if (!isShortEnough(password)) {
        return `Your password should be less than ${maxPasswordLength} characters. Give this another try after cutting some characters.`;
      }
      if (!isFormattedCorrectly(password)) {
        return "Your password should have a number, letter, and symbol. It’s safer that way!";
      }
    },
    optional
  });
};
