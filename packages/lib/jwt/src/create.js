import deps from "../deps.js";
import base64url from "base64url";

export default async ({
  options: { issuer, subject, audience, expiresIn, activeIn = 0 },
  payload = {},
  signFn,
  algorithm = "ES256",
}) => {
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

  const signature = await signFn(token);
  const encodedSignature = base64url.fromBase64(signature);

  return `${token}.${encodedSignature}`;
};
