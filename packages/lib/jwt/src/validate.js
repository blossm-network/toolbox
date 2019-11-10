const { unauthorized } = require("@blossm/errors");
const { decodeJwt } = require("../deps");

module.exports = async ({ token, verifyFn }) => {
  const [header, payload, signature] = token.split(".");

  const isVerified = await verifyFn({
    message: `${header}.${payload}`,
    signature
  });

  if (!isVerified) throw unauthorized.tokenInvalid();

  return decodeJwt(token);
};
