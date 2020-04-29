const deps = require("./deps");

module.exports = ({ name, domain, service, context = process.env.CONTEXT }) => {
  const read = ({
    contexts,
    tokenFns: { internal: internalTokenFn } = {},
  } = {}) => async ({ query, sort }) =>
    await deps
      .rpc(
        name,
        ...(domain ? [domain] : []),
        ...(service ? [service] : []),
        context,
        "view-composite"
      )
      .get({ query, ...(sort && { sort }) })
      .in({
        ...(contexts && { context: contexts }),
      })
      .with({
        ...(internalTokenFn && { internalTokenFn }),
      });
  const stream = ({
    contexts,
    tokenFns: { internal: internalTokenFn, external: externalTokenFn } = {},
  } = {}) => async (fn, { query, sort }) =>
    await deps
      .rpc(
        name,
        ...(domain ? [domain] : []),
        ...(service ? [service] : []),
        context,
        "view-composite"
      )
      .stream(fn, { query, ...(sort && { sort }) })
      .in({
        ...(contexts && { context: contexts }),
      })
      .with({
        path: `/stream`,
        ...(internalTokenFn && { internalTokenFn }),
        ...(externalTokenFn && { externalTokenFn }),
      });
  return {
    set: ({ context: contexts, tokenFns }) => {
      return {
        read: read({ contexts, tokenFns }),
        stream: stream({ contexts, tokenFns }),
      };
    },
    read: read(),
    stream: stream(),
  };
};
