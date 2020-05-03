const deps = require("./deps");

module.exports = ({
  name,
  domain,
  internalTokenFn,
  externalTokenFn,
} = {}) => async (req, res) => {
  const { body: response, headers = {} } = await deps
    .fact({
      name,
      domain,
    })
    .set({
      tokenFns: { internal: internalTokenFn, external: externalTokenFn },
      context: req.context,
      claims: req.claims,
    })
    .read(req.query);

  res.set(headers).status(200).send(response);
};
