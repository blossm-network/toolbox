const deps = require("../deps");
const base64url = require("./base64_url");

module.exports = async ({
  options: { issuer, subject, audience, expiresIn },
  payload = {},
  signFn
}) => {
  const header = {
    alg: "HS256",
    typ: "JWT"
  };

  const stringifiedHeader = deps.Utf8.parse(JSON.stringify(header));
  const encodedHeader = base64url(stringifiedHeader);
  const stringifiedPayload = deps.Utf8.parse(
    JSON.stringify({
      ...payload,
      iss: issuer,
      aud: audience,
      sub: subject,
      exp: deps.timestamp() + expiresIn,
      iat: deps.timestamp(),
      jti: deps.nonce()
    })
  );
  const encodedPayload = base64url(stringifiedPayload);
  const token = `${encodedHeader}.${encodedPayload}`;
  const stringifiedSignature = deps.Utf8.parse(await signFn(token));
  const encodedSignature = base64url(stringifiedSignature);

  //eslint-disable-next-line no-console
  console.log("sig: ", encodedSignature);
  //eslint-disable-next-line no-console
  console.log("token payload: ", token);

  return `${token}.${encodedSignature}`;
};
