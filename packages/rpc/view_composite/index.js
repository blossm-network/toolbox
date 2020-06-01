const deps = require("./deps");

module.exports = ({ name, domain, service, context = process.env.CONTEXT }) => {
  const read = ({
    contexts,
    token: { internalFn: internalTokenFn } = {},
  } = {}) => async ({ query, sort, root }) =>
    await deps
      .rpc(
        name,
        ...(domain ? [domain] : []),
        ...(service ? [service] : []),
        context,
        "view-composite"
      )
      .get({ query, ...(sort && { sort }), ...(root && { id: root }) })
      .in({
        ...(contexts && { context: contexts }),
      })
      .with({
        ...(internalTokenFn && { internalTokenFn }),
      });
  const stream = ({
    contexts,
    token: {
      internalFn: internalTokenFn,
      externalFn: externalTokenFn,
      key,
    } = {},
  } = {}) => async (fn, { query, sort, root }) =>
    await deps
      .rpc(
        name,
        ...(domain ? [domain] : []),
        ...(service ? [service] : []),
        context,
        "view-composite"
      )
      .stream(fn, { query, ...(sort && { sort }), ...(root && { id: root }) })
      .in({
        ...(contexts && { context: contexts }),
      })
      .with({
        path: `/stream`,
        ...(internalTokenFn && { internalTokenFn }),
        ...(externalTokenFn && { externalTokenFn }),
        ...(key && { key }),
      });
  return {
    set: ({ context: contexts, token }) => {
      return {
        read: read({ contexts, token }),
        stream: stream({ contexts, token }),
      };
    },
    read: read(),
    stream: stream(),
  };
};
