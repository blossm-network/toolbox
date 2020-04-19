const deps = require("./deps");

module.exports = ({
  name,
  domain,
  service,
  network,
  internalTokenFn,
  externalTokenFn,
} = {}) => async (req, res) => {
  await deps.validate(req.body);
  const { root, payload, headers } = req.body;

  let { body: response, statusCode } = await deps
    .command({
      name,
      domain,
      ...(service && { service }),
      ...(network && { network }),
    })
    .set({
      tokenFns: {
        internal: internalTokenFn,
        external: externalTokenFn,
      },
      context: req.context,
      claims: req.claims,
    })
    .issue(payload, { ...headers, root });

  // If the response has tokens, send them as cookies and remove them from the response.
  if (response && response.tokens) {
    for (const token of response.tokens) {
      if (!token.network || !token.type || !token.value) continue;
      const cookieName = token.type;
      res.cookie(cookieName, token.value, {
        domain: process.env.NETWORK,
        httpOnly: true,
        secure: true,
      });
    }

    // If removing tokens makes the response empty, set it to null to properly return a 204.
    if (Object.keys(response).length == 1) {
      response = null;
      statusCode = 204;
    } else {
      delete response.tokens;
    }
  }

  res.status(statusCode).send(response);
};
