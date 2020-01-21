const deps = require("../deps");
const base64url = require("base64url");

module.exports = async ({
  options: { issuer, subject, audience, expiresIn },
  payload = {},
  signFn
}) => {
  const header = {
    alg: "HS256",
    typ: "JWT"
  };

  //eslint-disable-next-line
  console.log("creating jwt:", {
    issuer,
    subject,
    audience,
    expiresIn,
    payload
  });
  const stringifiedHeader = JSON.stringify(header);
  const encodedHeader = base64url.fromBase64(
    Buffer.from(stringifiedHeader).toString("base64")
  );

  const stringifiedPayload = JSON.stringify({
    ...payload,
    iss: issuer,
    aud: audience,
    sub: subject,
    exp: deps.timestamp() + expiresIn,
    iat: deps.timestamp(),
    jti: deps.uuid()
  });
  //eslint-disable-next-line
  console.log("stringified payload:", stringifiedPayload);
  const encodedPayload = base64url.fromBase64(
    Buffer.from(stringifiedPayload).toString("base64")
  );
  const token = `${encodedHeader}.${encodedPayload}`;

  const signature = await signFn(token);
  const encodedSignature = base64url.fromBase64(signature);

  return `${token}.${encodedSignature}`;
};
