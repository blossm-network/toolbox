const deps = require("./deps");

module.exports = async ({ req, verifyFn }) => {
  const tokens = deps.tokensFromReq(req);

  const jwt = tokens.bearer || tokens.cookie;

  if (jwt == undefined) throw deps.invalidCredentialsError.tokenInvalid();

  const claims = await deps.validate({
    token: jwt,
    verifyFn
  });

  return claims;
};
