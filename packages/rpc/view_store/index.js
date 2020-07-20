const deps = require("./deps");

module.exports = ({ name, context = process.env.CONTEXT, network }) => {
  const internal = !network || network == process.env.NETWORK;
  const read = ({
    contexts,
    currentToken,
    token: {
      internalFn: internalTokenFn,
      externalFn: externalTokenFn,
      key,
    } = {},
  } = {}) => ({ query, sort, id } = {}) =>
    deps
      .rpc(name, context, "view-store")
      .get({
        ...(query && { query }),
        ...(sort && { sort }),
        ...(id && { id }),
      })
      .in({
        ...(contexts && { context: contexts }),
        ...(!internal && {
          network,
          host: `v.${context}.${network}`,
        }),
      })
      .with({
        ...(internalTokenFn && { internalTokenFn }),
        ...(externalTokenFn && { externalTokenFn }),
        ...(currentToken && { currentToken }),
        ...(key && { key }),
        ...(!internal && { path: `/${name}` }),
      });
  // const stream = ({
  //   contexts,
  //   currentToken,
  //   token: {
  //     internalFn: internalTokenFn,
  //     externalFn: externalTokenFn,
  //     key,
  //   } = {},
  // } = {}) => async (fn, { query, sort, root } = {}) =>
  //   await deps
  //     .rpc(
  //       name,
  //       ...(domain ? [domain] : []),
  //       ...(service ? [service] : []),
  //       context,
  //       "view-store"
  //     )
  //     .stream(fn, {
  //       ...(query && { query }),
  //       ...(sort && { sort }),
  //       ...(root && { id: root }),
  //     })
  //     .in({
  //       ...(contexts && { context: contexts }),
  //       ...(!internal && {
  //         network,
  //         host: `v.${domain}.${context}.${network}`,
  //       }),
  //     })
  //     .with({
  //       path: `/${internal ? "" : `${name}/`}stream`,
  //       ...(internalTokenFn && { internalTokenFn }),
  //       ...(externalTokenFn && { externalTokenFn }),
  //       ...(currentToken && { currentToken }),
  //       ...(key && { key }),
  //     });
  const update = ({
    contexts,
    token: { internalFn: internalTokenFn } = {},
  } = {}) => ({ query, update, id }) =>
    deps
      .rpc(name, context, "view-store")
      .post({ ...(query && { query }), ...(id && { id }), update })
      .in({
        ...(contexts && { context: contexts }),
      })
      .with({
        ...(internalTokenFn && { internalTokenFn }),
      });
  const del = ({
    contexts,
    token: { internalFn: internalTokenFn } = {},
  } = {}) => (query) =>
    deps
      .rpc(name, context, "view-store")
      .delete(query)
      .in({
        ...(contexts && { context: contexts }),
      })
      .with({
        ...(internalTokenFn && { internalTokenFn }),
      });
  return {
    set: ({ context: contexts, token, currentToken }) => {
      return {
        read: read({ contexts, token, currentToken }),
        // stream: stream({ contexts, token, currentToken }),
        update: update({ contexts, token }),
        delete: del({ contexts, token }),
      };
    },
    read: read(),
    // stream: stream(),
    update: update(),
    delete: del(),
  };
};
