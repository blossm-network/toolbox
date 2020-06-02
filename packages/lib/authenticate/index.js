const deps = require("./deps");

module.exports = async ({
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
    const [id, secret] = credentials.split(":");
    const claims = await keyClaimsFn({ id, secret });

    return claims;
  }

  throw deps.invalidCredentialsError.message("Token not found.");
};
