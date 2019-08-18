const { sign } = require("jsonwebtoken");

module.exports = async ({ data = {}, secret, expiresIn, options = {} }) => {
  if (expiresIn != undefined) options.expiresIn = expiresIn;
  const token = sign(data, secret, options);
  return token;
};
