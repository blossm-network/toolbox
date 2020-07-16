const asyncHandler = require("express-async-handler");

const deps = require("./deps");

module.exports = ({
  verifyFn,
  keyClaimsFn,
  strict = true,
  audience,
  algorithm,
  cookieKey,
  allowBasic = false,
}) =>
  asyncHandler(async (req, _, next) => {
    const tokens = deps.tokensFromReq(req, { cookieKey });
    const jwt = tokens.bearer || tokens.cookie;
    //TODO
    //eslint-disable-next-line no-console
    console.log({
      cookies: req.cookies,
      tokens,
      jwt,
      cookie: tokens.cookie,
      cookieKey,
    });

    if (jwt) req.token = jwt;
    try {
      const claims = await deps.authenticate({
        ...(jwt && { jwt }),
        ...(!jwt && allowBasic && { basic: tokens.basic }),
        verifyFn,
        keyClaimsFn,
        audience,
        algorithm,
      });
      req.context = claims.context;
      req.claims = {
        iss: claims.iss,
        aud: claims.aud,
        sub: claims.sub,
        exp: claims.exp,
        iat: claims.iat,
        jti: claims.jti,
      };
    } catch (err) {
      if (strict) throw err;
    }

    next();
  });
