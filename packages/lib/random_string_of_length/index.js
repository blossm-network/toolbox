import randomChar from "@blossm/random-char";

export default (length) => {
  let charString = "";
  for (let i = 0; i < length; i++) {
    let nextChar = randomChar();
    charString = charString.concat(nextChar);
  }
  return charString;
};
