import validator from "validator";

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

export default (email) =>
  validator.isEmail(email) && !usesDotWebDomain(email) && !hasDoubleByteChar(email);
