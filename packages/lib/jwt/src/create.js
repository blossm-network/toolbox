import deps from "../deps.js";
import base64url from "base64url";
import signatureFormat from "ecdsa-sig-formatter";
import resolveFormat from "./format.js";

export default async ({
  options: { issuer, subject, audience, expiresIn, activeIn = 0 },
  payload = {},
  signFn,
  algorithm = "ES256",
  format = "legacy",
}) => {
  const jose = resolveFormat({ format, algorithm });
  const now = deps.fineTimestamp();
  const time = (offset) =>
    jose ? (now + offset) / 1000 : deps.stringFromDate(new Date(now + offset));
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
    aud: !jose && audience instanceof Array ? audience.join(",") : audience,
    sub: subject,
    exp: time(expiresIn),
    nbf: time(activeIn),
    iat: jose ? time(0) : deps.dateString(),
    jti: deps.uuid(),
  });

  const encodedPayload = base64url.fromBase64(
    Buffer.from(stringifiedPayload).toString("base64")
  );
  const token = `${encodedHeader}.${encodedPayload}`;

  const signature = await signFn(token);
  const encodedSignature = jose
    ? signatureFormat.derToJose(signature, algorithm)
    : base64url.fromBase64(signature);

  return `${token}.${encodedSignature}`;
};
