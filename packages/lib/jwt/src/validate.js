import base64url from "base64url";
import decode from "./decode.js";

import deps from "../deps.js";

const timeClaim = (value) => {
  const timestamp = typeof value == "string" ? Date.parse(value) : NaN;
  if (!Number.isFinite(timestamp))
    throw deps.invalidCredentialsError.message(
      "The token time claim is invalid."
    );
  return timestamp;
};

export default async ({ token, verifyFn, audience, algorithm }) => {
  const [header, payload, signature] = token.split(".");

  const isVerified = await verifyFn({
    message: `${header}.${payload}`,
    signature: base64url.toBase64(signature),
  });

  if (!isVerified)
    throw deps.invalidCredentialsError.message("The signature is wrong.");

  const { headers, claims } = decode(token);

  if (headers.alg != algorithm)
    throw deps.invalidCredentialsError.message("The token algorithm is wrong.");

  if (!claims.aud.split(",").includes(audience))
    throw deps.invalidCredentialsError.message(
      "The token is intended for a different audience."
    );

  //Throw if the token is expired.
  const now = Date.now();

  if (timeClaim(claims.exp) <= now)
    throw deps.invalidCredentialsError.message("The token is expired.", {
      info: { reason: "expired" },
    });

  if (claims.nbf !== undefined && timeClaim(claims.nbf) > now)
    throw deps.invalidCredentialsError.message("The token isn't active yet.");

  return claims;
};
