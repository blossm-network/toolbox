module.exports = source => {
  // Remove padding equal characters
  // Replace characters according to base64url specifications
  return source
    .replace(/=+$/, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
};
