import base64url from "base64url";
import signatureFormat from "ecdsa-sig-formatter";
import resolveFormat from "./format.js";
import decode from "./decode.js";

import deps from "../deps.js";

const timeClaim = (value, jose) => {
  const timestamp = jose
    ? typeof value == "number"
      ? value * 1000
      : NaN
    : typeof value == "string"
    ? Date.parse(value)
    : NaN;
  if (!Number.isFinite(timestamp))
    throw deps.invalidCredentialsError.message(
      "The token time claim is invalid."
    );
  return timestamp;
};

export default async ({
  token,
  verifyFn,
  audience,
  algorithm,
  format = "legacy",
}) => {
  const jose = resolveFormat({ format, algorithm });
  const components = token.split(".");
  if (components.length != 3)
    throw deps.invalidCredentialsError.message("The token format is invalid.");
  const [header, payload, signature] = components;
  let decodedSignature;
  try {
    decodedSignature = jose
      ? signatureFormat.joseToDer(signature, algorithm).toString("base64")
      : base64url.toBase64(signature);
  } catch (_) {
    throw deps.invalidCredentialsError.message(
      "The token signature encoding is invalid."
    );
  }

  const isVerified = await verifyFn({
    message: `${header}.${payload}`,
    signature: decodedSignature,
  });

  if (!isVerified)
    throw deps.invalidCredentialsError.message("The signature is wrong.");

  const { headers, claims } = decode(token);

  if (headers.alg != algorithm)
    throw deps.invalidCredentialsError.message("The token algorithm is wrong.");

  const audiences = jose
    ? typeof claims.aud == "string"
      ? [claims.aud]
      : claims.aud
    : typeof claims.aud == "string"
    ? claims.aud.split(",")
    : [];
  if (
    !Array.isArray(audiences) ||
    !audiences.every((value) => typeof value == "string") ||
    !audiences.includes(audience)
  )
    throw deps.invalidCredentialsError.message(
      "The token is intended for a different audience."
    );

  //Throw if the token is expired.
  const now = Date.now();

  if (timeClaim(claims.exp, jose) <= now)
    throw deps.invalidCredentialsError.message("The token is expired.", {
      info: { reason: "expired" },
    });

  if (claims.nbf !== undefined && timeClaim(claims.nbf, jose) > now)
    throw deps.invalidCredentialsError.message("The token isn't active yet.");

  return claims;
};
