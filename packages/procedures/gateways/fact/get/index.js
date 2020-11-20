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
  const { body: response, headers = {} } = await deps
    .fact({
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
    .read({
      query: req.query,
      ...(req.params.root && { root: req.params.root }),
    });

  res.set(headers).status(200).send(response);
};
