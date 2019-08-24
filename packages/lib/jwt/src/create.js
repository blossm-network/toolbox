const { sign } = require("jsonwebtoken");

module.exports = async ({
  options: { issuer, subject, audience, expiresIn },
  payload = {},
  secret
}) => sign(payload, secret, { issuer, subject, audience, expiresIn });
