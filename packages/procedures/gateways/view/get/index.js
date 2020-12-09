const deps = require("./deps");

const getResponse = async ({
  procedure,
  network,
  name,
  internalTokenFn,
  nodeExternalTokenFn,
  context,
  claims,
  query,
  id,
  key,
  currentToken,
}) => {
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
            externalFn: ({ network } = {}) =>
              currentToken
                ? { token: currentToken, type: "Bearer" }
                : nodeExternalTokenFn({ network }),
          },
          ...(currentToken && { currentToken }),
          ...(context && { context }),
          ...(claims && { claims }),
        })
        .read({
          ...query,
          ...(id && { id }),
        });

      return response;
    }
    case "view-composite": {
      const { body: response } = await deps
        .viewComposite({
          name,
        })
        .set({
          token: {
            internalFn: internalTokenFn,
            externalFn: ({ network } = {}) =>
              currentToken
                ? { token: currentToken, type: "Bearer" }
                : nodeExternalTokenFn({ network }),
          },
          ...(currentToken && { currentToken }),
          ...(context && { context }),
          ...(claims && { claims }),
        })
        .read({
          ...query,
          ...(id && { id }),
        });
      return response;
    }
  }
};

module.exports = ({
  procedure,
  name,
  network,
  internalTokenFn,
  nodeExternalTokenFn,
  key,
  redirect,
} = {}) => async (req, res) => {
  if (
    process.env.CONTEXT &&
    (!req.context || !req.context[process.env.CONTEXT])
  )
    throw deps.forbiddenError.message("This context is forbidden.", {
      info: { redirect },
    });

  try {
    const response = await getResponse({
      procedure,
      network,
      name,
      internalTokenFn,
      nodeExternalTokenFn,
      context: req.context,
      claims: req.claims,
      query: req.query,
      id: req.params.id,
      key,
      currentToken: req.token,
    });
    res.status(200).send(response);
  } catch (err) {
    throw err.statusCode == 403
      ? deps.forbiddenError.message(err.message, {
          info: { redirect },
        })
      : err;
  }
};
