import deps from "./deps.js";

export default async ({
  jwt,
  basic,
  verifyFn,
  keyClaimsFn,
  audience,
  algorithm,
}) => {
  if (jwt) {
    const claims = await deps.validate({
      token: jwt,
      verifyFn,
      audience,
      algorithm,
    });
    return claims;
  } else if (basic && keyClaimsFn) {
    const credentials = Buffer.from(basic, "base64").toString("utf8");
    const separator = credentials.indexOf(":");
    if (separator == -1)
      throw deps.invalidCredentialsError.message(
        "The Basic token is malformed."
      );
    const root = credentials.slice(0, separator);
    const secret = credentials.slice(separator + 1);
    const claims = await keyClaimsFn({ root, secret });

    return claims;
  }

  throw deps.invalidCredentialsError.message("Token not found.");
};
