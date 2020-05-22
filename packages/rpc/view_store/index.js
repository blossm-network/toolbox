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
    tokenFns: { internal: internalTokenFn, external: externalTokenFn } = {},
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
        ...(!internal && { path: `/${name}` }),
      });
  const stream = ({
    contexts,
    tokenFns: { internal: internalTokenFn, external: externalTokenFn } = {},
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
      });
  const update = ({
    contexts,
    tokenFns: { internal: internalTokenFn, external: externalTokenFn } = {},
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
        ...(externalTokenFn && { externalTokenFn }),
      });
  const del = ({
    contexts,
    tokenFns: { internal: internalTokenFn, external: externalTokenFn } = {},
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
        ...(externalTokenFn && { externalTokenFn }),
      });
  return {
    set: ({ context: contexts, tokenFns }) => {
      return {
        read: read({ contexts, tokenFns }),
        stream: stream({ contexts, tokenFns }),
        update: update({ contexts, tokenFns }),
        delete: del({ contexts, tokenFns }),
      };
    },
    read: read(),
    stream: stream(),
    update: update(),
    delete: del(),
  };
};
