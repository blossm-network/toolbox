const deps = require("./deps");

module.exports = async ({
  req,
  verifyFn,
  keyClaimsFn,
  audience,
  algorithm,
  allowBasic = false,
}) => {
  const tokens = deps.tokensFromReq(req);

  const jwt = tokens.bearer || tokens.cookie;

  if (jwt) {
    const claims = await deps.validate({
      token: jwt,
      verifyFn,
      audience,
      algorithm,
    });
    return claims;
  } else if (tokens.basic && allowBasic && keyClaimsFn) {
    const credentials = Buffer.from(tokens.basic, "base64").toString("ascii");
    const [id, secret] = credentials.split(":");
    const claims = await keyClaimsFn({ id, secret });

    return claims;
  }

  throw deps.invalidCredentialsError.message("Token not found.");
};
