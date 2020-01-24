const base64url = require("base64url");
const { decodeJwt } = require("../deps");

const deps = require("../deps");

module.exports = async ({ token, verifyFn }) => {
  const [header, payload, signature] = token.split(".");

  const isVerified = await verifyFn({
    message: `${header}.${payload}`,
    signature: base64url.toBase64(signature)
  });

  if (!isVerified) throw deps.invalidCredentialsError.tokenInvalid();

  const claims = decodeJwt(token);

  //Throw if the token is expired.
  const now = new Date();

  if (Date.parse(claims.exp) < now)
    throw deps.invalidCredentialsError.tokenExpired();

  return claims;
};
