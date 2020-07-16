const deps = require("../deps");
const base64url = require("base64url");

module.exports = async ({
  options: { issuer, subject, audience, expiresIn, activeIn = 0 },
  payload = {},
  signFn,
  algorithm = "ES256",
}) => {
  //TODO
  //eslint-disable-next-line
  console.log({
    issuer,
    subject,
    audience,
    expiresIn,
    activeIn,
    payload,
    signFn,
    algorithm,
  });
  const header = {
    alg: algorithm,
    typ: "JWT",
  };

  const stringifiedHeader = JSON.stringify(header);
  const encodedHeader = base64url.fromBase64(
    Buffer.from(stringifiedHeader).toString("base64")
  );

  const stringifiedPayload = JSON.stringify({
    ...payload,
    iss: issuer,
    aud: audience instanceof Array ? audience.join(",") : audience,
    sub: subject,
    exp: deps.stringFromDate(new Date(deps.fineTimestamp() + expiresIn)),
    nbf: deps.stringFromDate(new Date(deps.fineTimestamp() + activeIn)),
    iat: deps.dateString(),
    jti: deps.uuid(),
  });

  const encodedPayload = base64url.fromBase64(
    Buffer.from(stringifiedPayload).toString("base64")
  );
  const token = `${encodedHeader}.${encodedPayload}`;

  //TODO
  //eslint-disable-next-line no-console
  console.log({ tokenBody: token, encodedPayload });
  const signature = await signFn(token);
  //TODO
  //eslint-disable-next-line no-console
  console.log({ signature });
  const encodedSignature = base64url.fromBase64(signature);

  //TODO
  //eslint-disable-next-line no-console
  console.log({ result: `${token}.${encodedSignature}` });
  return `${token}.${encodedSignature}`;
};
