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
  contexts,
} = {}) => async (req, res) => {
  if (
    contexts &&
    (!req.context ||
      contexts.filter((c) => req.context[c]).length != contexts.length)
  )
    throw deps.forbiddenError.message("This context is forbidden.", {
      info: { redirect },
    });

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

    if (name == "change-scene") {
      console.log({
        response,
        responseHeaders,
        statusCode,
      });
    }

    // If the response has tokens, send them as cookies.
    if (response && response.tokens) {
      for (const token of response.tokens) {
        if (name == "change-scene") {
          console.log({
            token,
          });
        }
        if (!token.network || !token.type || !token.value) continue;
        const cookieName = token.type;
        const { headers } = deps.decode(token.value);
        res.cookie(cookieName, token.value, {
          domain: token.network,
          httpOnly: true,
          secure: true,
          expires: new Date(headers.exp),
        });
      }

      delete response.tokens;
    }

    if (responseHeaders && responseHeaders["set-cookie"])
      res.set("set-cookie", responseHeaders["set-cookie"]);

    res.status(statusCode).send(response);
  } catch (err) {
    throw err.statusCode == 403
      ? deps.forbiddenError.message("This context is forbidden.", {
          info: { redirect },
        })
      : err;
  }
};
