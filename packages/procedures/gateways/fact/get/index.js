const deps = require("./deps");

module.exports = ({
  name,
  domain,
  internalTokenFn,
  externalTokenFn,
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
        externalFn: ({ network, key } = {}) => {
          return req.token || externalTokenFn({ network, key });
        },
        key,
      },
      context: req.context,
      claims: req.claims,
    })
    .read(req.query);

  res.set(headers).status(200).send(response);
};
