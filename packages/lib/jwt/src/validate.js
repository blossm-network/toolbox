import base64url from "base64url";
import decode from "./decode.js";

import deps from "../deps.js";

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
  const now = new Date();

  if (Date.parse(claims.exp) < now)
    throw deps.invalidCredentialsError.message("The token is expired.", {
      info: { reason: "expired" },
    });

  if (claims.nbf && Date.parse(claims.nbf) > now)
    throw deps.invalidCredentialsError.message("The token isn't active yet.");

  return claims;
};
