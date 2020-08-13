const deps = require("./deps");

module.exports = ({
  procedure,
  name,
  network,
  internalTokenFn,
  nodeExternalTokenFn,
  key,
  redirect,
} = {}) => async (req, res) => {
  if (!req.context || !req.context[process.env.CONTEXT])
    throw deps.forbiddenError.message("This context is forbidden.", {
      info: { redirect },
    });

  try {
    switch (procedure) {
      case "view-store": {
        const { body: response } = await deps
          .viewStore({
            name,
            ...(network && { network }),
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
            ...req.query,
            ...(req.params.id && { id: req.params.id }),
          });

        res.status(200).send(response);
        break;
      }
      case "view-composite": {
        const { body: response } = await deps
          .viewComposite({
            name,
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
            ...req.query,
            ...(req.params.id && { id: req.params.id }),
          });
        res.status(200).send(response);
        break;
      }
    }
  } catch (err) {
    throw err.statusCode == 403
      ? deps.forbiddenError.message(err.message, {
          info: { redirect },
        })
      : err;
  }
};
