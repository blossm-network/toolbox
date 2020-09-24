const deps = require("./deps");

module.exports = ({
  name,
  domain,
  service,
  network,
  internalTokenFn,
  nodeExternalTokenFn,
  key,
  redirect,
} = {}) => async (req, res) => {
  await deps.validate(req.body);
  const { payload, headers, root } = req.body;

  try {
    let { body: response, headers: responseHeaders, statusCode } = await deps
      .command({
        name,
        domain,
        ...(service && { service }),
        ...(network && {
          network: `${
            process.env.NODE_ENV == "production" ? "" : "snd."
          }${network}`,
        }),
      })
      .set({
        token: {
          internalFn: internalTokenFn,
          externalFn: ({ network, key } = {}) =>
            req.token
              ? { token: req.token, type: "Bearer" }
              : nodeExternalTokenFn({ network, key }),
          key,
        },
        ...(req.token && { currentToken: req.token }),
        ...(req.context && { context: req.context }),
        ...(req.claims && { claims: req.claims }),
      })
      .issue(payload, {
        ...(root && { root }),
        ...(headers.idempotency && {
          headers: { idempotency: headers.idempotency },
        }),
        tx: {
          ip: req.headers["x-forwarded-for"],
          path: [
            {
              timestamp: deps.dateString(),
              issued: headers.issued,
              procedure: process.env.PROCEDURE,
              hash: process.env.OPERATION_HASH,
              domain: process.env.DOMAIN,
              service: process.env.SERVICE,
              network: process.env.NETWORK,
              host: process.env.HOST,
            },
          ],
        },
      });

    // If the response has tokens, send them as cookies.
    if (response) {
      if (response._tokens) {
        for (const token of response._tokens) {
          if (!token.network || !token.type || !token.value) continue;
          const cookieName = token.type;
          const { claims } = deps.decode(token.value);
          res.cookie(cookieName, token.value, {
            domain: token.network,
            httpOnly: true,
            secure: true,
            expires: new Date(claims.exp),
          });
        }
        delete response._tokens;
      }
      if (response._revokeKeys) {
        for (const key of response._revokeKeys) res.clearCookie(key);
        delete response._revokeKeys;
      }
    }

    if (responseHeaders && responseHeaders["set-cookie"])
      res.set("set-cookie", responseHeaders["set-cookie"]);

    res.status(statusCode).send(response);
  } catch (err) {
    throw err.statusCode == 403
      ? deps.forbiddenError.message(err.message, {
          info: { redirect },
        })
      : err;
  }
};
