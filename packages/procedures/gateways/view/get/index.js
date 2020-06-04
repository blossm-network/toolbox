const deps = require("./deps");

module.exports = ({
  procedure,
  name,
  domain,
  service,
  network,
  internalTokenFn,
  externalTokenFn,
  key,
} = {}) => async (req, res) => {
  switch (procedure) {
    case "view-store": {
      const { body: response } = await deps
        .viewStore({
          name,
          ...(domain && { domain }),
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
            ...(req.token &&
              network == process.env.NETWORK && { current: req.token }),
          },
          context: req.context,
        })
        .read({
          ...req.query,
          ...(req.params.root && { root: req.params.root }),
        });

      res.status(200).send(response);
      break;
    }
    case "view-composite": {
      const { body: response } = await deps
        .viewComposite({
          name,
          ...(domain && { domain }),
          ...(service && { service }),
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
        })
        .read({
          ...req.query,
          ...(req.params.root && { root: req.params.root }),
        });
      res.status(200).send(response);
      break;
    }
  }
};
