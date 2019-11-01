const deps = require("./deps");
const { unauthorized } = require("@sustainers/errors");

module.exports = async ({ req, verifyFn, requiresToken = true }) => {
  const tokens = deps.tokensFromReq(req);

  //eslint-disable-next-line no-console
  console.log("IN AUTHEN LIB tokens: ", tokens);

  const jwt = tokens.bearer || tokens.cookie;

  if (jwt == undefined) {
    if (requiresToken) throw unauthorized.tokenInvalid;
    return {};
  }

  const claims = await deps.validate({
    token: jwt,
    verifyFn
  });

  return claims;
};
