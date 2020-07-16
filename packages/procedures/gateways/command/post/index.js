const deps = require("./deps");

module.exports = ({
  name,
  domain,
  service,
  network,
  internalTokenFn,
  nodeExternalTokenFn,
  key,
} = {}) => async (req, res) => {
  await deps.validate(req.body);
  const { payload, headers, root } = req.body;

  let { body: response, headers: responseHeaders = {}, statusCode } = await deps
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
      headers: {
        ...(headers.idempotency && { idempotency: headers.idempotency }),
        ...(headers.trace && { trace: headers.trace }),
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
  if (response && response.tokens) {
    for (const token of response.tokens) {
      if (!token.network || !token.type || !token.value) continue;
      const cookieName = token.type;
      res.cookie(cookieName, token.value, {
        domain: token.network,
        httpOnly: true,
        secure: true,
      });
    }
  }

  res.status(statusCode).send(response);
};
