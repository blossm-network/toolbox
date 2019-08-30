const { Base64 } = require("../deps");

module.exports = source => {
  // Encode in classical base64
  // Remove padding equal characters
  // Replace characters according to base64url specifications
  return Base64.stringify(source)
    .replace(/=+$/, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
};
