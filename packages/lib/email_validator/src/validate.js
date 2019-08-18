const { isEmail } = require("validator");

let hasDoubleByteChar = str => {
  for (var i = 0, n = str.length; i < n; i++) {
    if (str.charCodeAt(i) > 255) {
      return true;
    }
  }
  return false;
};

let usesDotWebDomain = str => {
  return str.endsWith(".web");
};

module.exports = email => {
  if (!isEmail(email) || usesDotWebDomain(email) || hasDoubleByteChar(email)) {
    throw `${email} is not a valid email.`;
  }
};
