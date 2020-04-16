const asyncHandler = require("express-async-handler");

const deps = require("./deps");

module.exports = ({
  verifyFn,
  keyClaimsFn,
  strict = true,
  audience,
  algorithm,
  allowBasic,
}) =>
  asyncHandler(async (req, _, next) => {
    try {
      const claims = await deps.authenticate({
        req,
        verifyFn,
        keyClaimsFn,
        audience,
        algorithm,
        allowBasic,
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
