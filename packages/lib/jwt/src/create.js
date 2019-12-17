const deps = require("../deps");
const cleanBase64 = require("./clean_base64");

module.exports = async ({
  options: { issuer, subject, audience, expiresIn },
  payload = {},
  signFn
}) => {
  const header = {
    alg: "HS256",
    typ: "JWT"
  };

  const stringifiedHeader = JSON.stringify(header);
  const encodedHeader = cleanBase64(
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
  const encodedPayload = cleanBase64(
    Buffer.from(stringifiedPayload).toString("base64")
  );
  const token = `${encodedHeader}.${encodedPayload}`;

  const signature = await signFn(token);
  const encodedSignature = cleanBase64(signature);

  return `${token}.${encodedSignature}`;
};
