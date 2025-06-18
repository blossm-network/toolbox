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
    const credentials = Buffer.from(basic, "base64").toString("ascii");
    const [root, secret] = credentials.split(":");
    const claims = await keyClaimsFn({ root, secret });

    return claims;
  }

  throw deps.invalidCredentialsError.message("Token not found.");
};
