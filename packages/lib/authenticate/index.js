const deps = require("./deps");

module.exports = async ({ req, verifyFn, keyClaimsFn }) => {
  const tokens = deps.tokensFromReq(req);

  //TODO
  //eslint-disable-next-line no-console
  console.log({ tokens });

  const jwt = tokens.bearer || tokens.cookie;

  if (jwt) {
    const claims = await deps.validate({
      token: jwt,
      verifyFn
    });
    return claims;
  } else if (tokens.basic) {
    const credentials = Buffer.from(tokens.basic, "base64").toString("ascii");
    const [id, secret] = credentials.split(":");
    const claims = await keyClaimsFn({ id, secret });
    //TODO
    //eslint-disable-next-line no-console
    console.log({ claims });

    return claims;
  }

  throw deps.invalidCredentialsError.tokenInvalid();
};
