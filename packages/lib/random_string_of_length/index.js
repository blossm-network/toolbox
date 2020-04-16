const randomChar = require("@blossm/random-char");

module.exports = (length) => {
  let charString = "";
  for (let i = 0; i < length; i++) {
    let nextChar = randomChar();
    charString = charString.concat(nextChar);
  }
  return charString;
};
