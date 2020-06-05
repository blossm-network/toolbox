const deps = require("./deps");

module.exports = ({
  name,
  domain,
  internalTokenFn,
  nodeExternalTokenFn,
  key,
} = {}) => async (req, res) => {
  const { body: response, headers = {} } = await deps
    .fact({
      name,
      domain,
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
      ...(req.context && { context: req.context }),
      ...(req.claims && { claims: req.claims }),
    })
    .read(req.query);

  res.set(headers).status(200).send(response);
};
