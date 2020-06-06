const deps = require("./deps");

module.exports = ({
  name,
  domain,
  service,
  context = process.env.CONTEXT,
  network,
}) => {
  const internal = !network || network == process.env.NETWORK;
  const read = ({
    contexts,
    token: {
      internalFn: internalTokenFn,
      externalFn: externalTokenFn,
      current: currentToken,
      key,
    } = {},
  } = {}) => async ({ query, sort, root } = {}) =>
    await deps
      .rpc(
        name,
        ...(domain ? [domain] : []),
        ...(service ? [service] : []),
        context,
        "view-store"
      )
      .get({
        ...(query && { query }),
        ...(sort && { sort }),
        ...(root && { id: root }),
      })
      .in({
        ...(contexts && { context: contexts }),
        ...(!internal && {
          network,
          host: `v${domain ? `.${domain}` : ""}.${context}.${network}`,
        }),
      })
      .with({
        ...(internalTokenFn && { internalTokenFn }),
        ...(externalTokenFn && { externalTokenFn }),
        ...(currentToken && { currentToken }),
        ...(key && { key }),
        ...(!internal && { path: `/${name}` }),
      });
  const stream = ({
    contexts,
    token: {
      internalFn: internalTokenFn,
      externalFn: externalTokenFn,
      current: currentToken,
      key,
    } = {},
  } = {}) => async (fn, { query, sort, root } = {}) =>
    await deps
      .rpc(
        name,
        ...(domain ? [domain] : []),
        ...(service ? [service] : []),
        context,
        "view-store"
      )
      .stream(fn, {
        ...(query && { query }),
        ...(sort && { sort }),
        ...(root && { id: root }),
      })
      .in({
        ...(contexts && { context: contexts }),
        ...(!internal && {
          network,
          host: `v.${domain}.${context}.${network}`,
        }),
      })
      .with({
        path: `/${internal ? "" : `${name}/`}stream`,
        ...(internalTokenFn && { internalTokenFn }),
        ...(externalTokenFn && { externalTokenFn }),
        ...(currentToken && { currentToken }),
        ...(key && { key }),
      });
  const update = ({
    contexts,
    token: { internalFn: internalTokenFn } = {},
  } = {}) => async (root, view) =>
    await deps
      .rpc(
        name,
        ...(domain ? [domain] : []),
        ...(service ? [service] : []),
        context,
        "view-store"
      )
      .put(root, { view })
      .in({
        ...(contexts && { context: contexts }),
      })
      .with({
        ...(internalTokenFn && { internalTokenFn }),
      });
  const del = ({
    contexts,
    token: { internalFn: internalTokenFn } = {},
  } = {}) => async (root) =>
    await deps
      .rpc(
        name,
        ...(domain ? [domain] : []),
        ...(service ? [service] : []),
        context,
        "view-store"
      )
      .delete(root)
      .in({
        ...(contexts && { context: contexts }),
      })
      .with({
        ...(internalTokenFn && { internalTokenFn }),
      });
  return {
    set: ({ context: contexts, token }) => {
      return {
        read: read({ contexts, token }),
        stream: stream({ contexts, token }),
        update: update({ contexts, token }),
        delete: del({ contexts, token }),
      };
    },
    read: read(),
    stream: stream(),
    update: update(),
    delete: del(),
  };
};
