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
  //TODO
  console.log({
    context: req.context,
    envContext: process.env.CONTEXT,
    redirect,
    procedure,
    query: req.query,
    root: req.params.root,
  });
  if (!req.context || !req.context[process.env.CONTEXT])
    throw deps.forbiddenError.message("This context is forbidden.", {
      info: { redirect },
    });

  console.log("BACONNNN");
  switch (procedure) {
    case "view-store": {
      try {
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
            ...(req.params.root && { root: req.params.root }),
          });

        console.log({ response });
        res.status(200).send(response);
        break;
      } catch (err) {
        throw err.statusCode == 403
          ? deps.forbiddenError.message("This context is forbidden.", {
              info: { redirect },
            })
          : err;
      }
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
          ...(req.params.root && { root: req.params.root }),
        });
      res.status(200).send(response);
      break;
    }
  }
};
