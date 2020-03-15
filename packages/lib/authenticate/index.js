const deps = require("./deps");

module.exports = async ({ req, verifyFn, tokenClaimsFn }) => {
  const tokens = deps.tokensFromReq(req);

  const jwt = tokens.bearer || tokens.cookie;

  if (jwt) {
    const claims = await deps.validate({
      token: jwt,
      verifyFn
    });
    return claims;
  } else if (tokens.basic) {
    const claims = await tokenClaimsFn({ header: tokens.basic });
    return claims;
  }

  throw deps.invalidCredentialsError.tokenInvalid();
};
