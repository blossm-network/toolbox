const deps = require("./deps");

module.exports = ({
  procedure,
  name,
  domain,
  service,
  network,
  internalTokenFn,
  nodeExternalTokenFn,
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
                : nodeExternalTokenFn({ network, key }),
            ...(req.token && { current: req.token }),
            key,
          },
          ...(req.context && { context: req.context }),
          ...(req.claims && { claims: req.claims }),
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
                : nodeExternalTokenFn({ network, key }),
            ...(req.token && { current: req.token }),
            key,
          },
          ...(req.context && { context: req.context }),
          ...(req.claims && { claims: req.claims }),
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
