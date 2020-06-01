const deps = require("./deps");

module.exports = async ({
  req,
  verifyFn,
  keyClaimsFn,
  audience,
  algorithm,
  cookieKey,
  allowBasic = false,
}) => {
  const tokens = deps.tokensFromReq(req, { cookieKey });

  const jwt = tokens.bearer || tokens.cookie;

  //TODO
  //eslint-disable-next-line no-console
  console.log({ tokens, jwt });

  if (jwt) {
    const claims = await deps.validate({
      token: jwt,
      verifyFn,
      audience,
      algorithm,
    });
    return { claims, jwt };
  } else if (tokens.basic && allowBasic && keyClaimsFn) {
    const credentials = Buffer.from(tokens.basic, "base64").toString("ascii");
    const [id, secret] = credentials.split(":");
    const claims = await keyClaimsFn({ id, secret });

    return { claims };
  }

  throw deps.invalidCredentialsError.message("Token not found.");
};
