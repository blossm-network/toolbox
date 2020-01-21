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

  return decodeJwt(token);
};
