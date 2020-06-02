const deps = require("./deps");

module.exports = ({
  name,
  domain,
  service,
  network,
  internalTokenFn,
  externalTokenFn,
  key,
} = {}) => async (req, res) => {
  await deps.validate(req.body);
  const { root, payload, headers } = req.body;

  let { body: response, headers: responseHeaders = {}, statusCode } = await deps
    .command({
      name,
      domain,
      ...(service && { service }),
      ...(network && { network }),
    })
    .set({
      token: {
        internalFn: internalTokenFn,
        externalFn: ({ network, key } = {}) =>
          req.token
            ? { token: req.token, type: "Bearer" }
            : externalTokenFn({ network, key }),
        key,
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
        domain: token.network,
        //TODO
        httpOnly: process.env.NODE_ENV != "development",
        secure: process.env.NODE_ENV != "development", //true,
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

  res.set(responseHeaders).status(statusCode).send(response);
};
