const base64url = require("base64url");
const { decodeJwt } = require("../deps");

const deps = require("../deps");

module.exports = async ({ token, verifyFn, audience, algorithm }) => {
  const [header, payload, signature] = token.split(".");

  const isVerified = await verifyFn({
    message: `${header}.${payload}`,
    signature: base64url.toBase64(signature)
  });

  if (!isVerified) {
    //TODO
    //eslint-disable-next-line no-console
    console.log("NOT VER: ", {
      isVerified,
      header,
      payload,
      signature,
      verifyFn
    });
  }
  if (!isVerified) throw deps.invalidCredentialsError.tokenInvalid();

  const { alg } = decodeJwt(token, { header: true });

  if (alg != algorithm) {
    //TODO
    //eslint-disable-next-line no-console
    console.log("NOT VER 2: ", {
      alg,
      algorithm
    });
  }
  if (alg != algorithm) throw deps.invalidCredentialsError.tokenInvalid();

  const claims = decodeJwt(token);

  if (!claims.aud.split(",").includes(audience))
    throw deps.invalidCredentialsError.wrongAudience();

  //Throw if the token is expired.
  const now = new Date();

  if (Date.parse(claims.exp) < now)
    throw deps.invalidCredentialsError.tokenExpired();

  if (claims.nbf && Date.parse(claims.nbf) > now)
    throw deps.invalidCredentialsError.tokenNotActive();

  return claims;
};
