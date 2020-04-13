const deps = require("./deps");

module.exports = ({ name, domain, context = process.env.CONTEXT, network }) => {
  const internal = !network || network == process.env.NETWORK;
  const create = ({
    contexts,
    claims,
    tokenFns: { internal: internalTokenFn, external: externalTokenFn } = {}
  } = {}) => async view =>
    await deps
      .rpc(name, ...(domain ? [domain] : []), context, "view-store")
      .post({ view })
      .in({
        ...(contexts && { context: contexts })
      })
      .with({
        ...(internalTokenFn && { internalTokenFn }),
        ...(externalTokenFn && { externalTokenFn }),
        ...(claims && { claims })
      });
  const read = ({
    contexts,
    claims,
    tokenFns: { internal: internalTokenFn, external: externalTokenFn } = {}
  } = {}) => async ({ query, sort }) =>
    await deps
      .rpc(name, ...(domain ? [domain] : []), context, "view-store")
      .get({ query, ...(sort && { sort }) })
      .in({
        ...(contexts && { context: contexts }),
        ...(!internal && {
          network,
          host: `view${domain ? `.${domain}` : ""}.${context}.${network}`
        })
      })
      .with({
        ...(internalTokenFn && { internalTokenFn }),
        ...(externalTokenFn && { externalTokenFn }),
        ...(claims && { claims }),
        ...(!internal && { path: `/${name}` })
      });
  const stream = ({
    contexts,
    claims,
    tokenFns: { internal: internalTokenFn, external: externalTokenFn } = {}
  } = {}) => async ({ query, sort }) =>
    await deps
      .rpc(name, ...(domain ? [domain] : []), context, "view-store")
      .get({ query, ...(sort && { sort }) })
      .in({
        ...(contexts && { context: contexts }),
        ...(!internal && {
          network,
          host: `view.${domain}.${context}.${network}`
        })
      })
      .with({
        path: `/${internal ? "" : `${name}/`}stream`,
        ...(internalTokenFn && { internalTokenFn }),
        ...(externalTokenFn && { externalTokenFn }),
        ...(claims && { claims })
      });
  const update = ({
    contexts,
    claims,
    tokenFns: { internal: internalTokenFn, external: externalTokenFn } = {}
  } = {}) => async (id, view) =>
    await deps
      .rpc(name, ...(domain ? [domain] : []), context, "view-store")
      .put(id, { view })
      .in({
        ...(contexts && { context: contexts })
      })
      .with({
        ...(internalTokenFn && { internalTokenFn }),
        ...(externalTokenFn && { externalTokenFn }),
        ...(claims && { claims })
      });
  const del = ({
    contexts,
    claims,
    tokenFns: { internal: internalTokenFn, external: externalTokenFn } = {}
  } = {}) => async id =>
    await deps
      .rpc(name, ...(domain ? [domain] : []), context, "view-store")
      .delete(id)
      .in({
        ...(contexts && { context: contexts })
      })
      .with({
        ...(internalTokenFn && { internalTokenFn }),
        ...(externalTokenFn && { externalTokenFn }),
        ...(claims && { claims })
      });
  return {
    set: ({ context: contexts, claims, tokenFns }) => {
      return {
        create: create({ contexts, claims, tokenFns }),
        read: read({ contexts, claims, tokenFns }),
        stream: stream({ contexts, claims, tokenFns }),
        update: update({ contexts, claims, tokenFns }),
        delete: del({ contexts, claims, tokenFns })
      };
    },
    create: create(),
    read: read(),
    stream: stream(),
    update: update(),
    delete: del()
  };
};
