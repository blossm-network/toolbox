const { isEmail } = require("validator");

const hasDoubleByteChar = (str) => {
  for (var i = 0, n = str.length; i < n; i++) {
    if (str.charCodeAt(i) > 255) {
      return true;
    }
  }
  return false;
};

const usesDotWebDomain = (str) => {
  return str.endsWith(".web");
};

module.exports = (email) =>
  isEmail(email) && !usesDotWebDomain(email) && !hasDoubleByteChar(email);
