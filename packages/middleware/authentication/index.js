const asyncHandler = require("express-async-handler");

const deps = require("./deps");

module.exports = ({
  verifyFn,
  keyClaimsFn,
  protection = "strict",
  audience,
  algorithm,
  cookieKey,
  allowBasic = false,
  allowsQueryToken,
}) =>
  asyncHandler(async (req, _, next) => {
    const tokens = deps.tokensFromReq(req, {
      cookieKey,
      ...(allowsQueryToken && { allowsQueryToken }),
    });
    const jwt = tokens.bearer || tokens.cookie;

    if (jwt) req.token = jwt;

    let shouldThrow = protection == "strict";
    try {
      const claims = await deps.authenticate({
        ...(jwt && { jwt }),
        ...(!jwt && allowBasic && { basic: tokens.basic }),
        verifyFn,
        keyClaimsFn,
        audience,
        algorithm,
      });

      if (typeof protection == "object") {
        shouldThrow = true;
        for (const key in protection) {
          if (claims.context[key] == undefined)
            throw deps.unauthorizedError.message("This route is protected.");
          if (
            !protection[key].some(
              (value) =>
                value.root == claims.context[key].root &&
                value.service == claims.context[key].service &&
                value.network == claims.context[key].network
            )
          )
            throw deps.unauthorizedError.message("This route is protected.");
        }
      }

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
      if (shouldThrow) throw err;
    }

    next();
  });
