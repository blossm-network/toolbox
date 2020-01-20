const deps = require("./deps");

module.exports = async ({ req, verifyFn }) => {
  const tokens = deps.tokensFromReq(req);

  //eslint-disable-next-line
  console.log("Authenticating: ", { tokens });
  const jwt = tokens.bearer || tokens.cookie;
  //eslint-disable-next-line
  console.log("jwt: ", { jwt });

  if (jwt == undefined) throw deps.invalidCredentialsError.tokenInvalid();

  const claims = await deps.validate({
    token: jwt,
    verifyFn
  });

  //eslint-disable-next-line
  console.log("claims: ", { claims });
  return claims;
};
