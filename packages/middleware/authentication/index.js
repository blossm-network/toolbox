const asyncHandler = require("express-async-handler");

const deps = require("./deps");

module.exports = ({ verifyFn }) =>
  asyncHandler(async (req, _, next) => {
    const claims = await deps.authenticate({
      req,
      verifyFn
    });

    req.context = claims.context;
    req.session = {
      iss: claims.iss,
      aud: claims.aud,
      sub: claims.sub,
      exp: claims.exp,
      iat: claims.iat,
      jti: claims.jti
    };
    next();
  });
