const deps = require("./deps");

module.exports = ({ name, domain, service = process.env.SERVICE, network }) => {
  const internal = !network || network == process.env.NETWORK;
  const create = ({
    context,
    claims,
    tokenFns: { internal: internalTokenFn, external: externalTokenFn } = {}
  } = {}) => async view =>
    await deps
      .rpc(name, domain, service, "view-store")
      .post({ view })
      .in({
        ...(context && { context })
      })
      .with({
        ...(internalTokenFn && { internalTokenFn }),
        ...(externalTokenFn && { externalTokenFn }),
        ...(claims && { claims })
      });
  const read = ({
    context,
    claims,
    tokenFns: { internal: internalTokenFn, external: externalTokenFn } = {}
  } = {}) => async ({ query, sort }) =>
    await deps
      .rpc(name, domain, service, "view-store")
      .get({ query, ...(sort && { sort }) })
      .in({
        ...(context && { context }),
        ...(!internal && {
          network,
          host: `view.${domain}.${service}.${network}`
        })
      })
      .with({
        ...(internalTokenFn && { internalTokenFn }),
        ...(externalTokenFn && { externalTokenFn }),
        ...(claims && { claims }),
        ...(!internal && { path: `/${name}` })
      });
  const stream = ({
    context,
    claims,
    tokenFns: { internal: internalTokenFn, external: externalTokenFn } = {}
  } = {}) => async ({ query, sort }) =>
    await deps
      .rpc(name, domain, service, "view-store")
      .get({ query, ...(sort && { sort }) })
      .in({
        ...(context && { context }),
        ...(!internal && {
          network,
          host: `view.${domain}.${service}.${network}`
        })
      })
      .with({
        path: `/${internal ? "" : `${name}/`}stream`,
        ...(internalTokenFn && { internalTokenFn }),
        ...(externalTokenFn && { externalTokenFn }),
        ...(claims && { claims })
      });
  const update = ({
    context,
    claims,
    tokenFns: { internal: internalTokenFn, external: externalTokenFn } = {}
  } = {}) => async (root, view) =>
    await deps
      .rpc(name, domain, service, "view-store")
      .put(root, { view })
      .in({
        ...(context && { context })
      })
      .with({
        ...(internalTokenFn && { internalTokenFn }),
        ...(externalTokenFn && { externalTokenFn }),
        ...(claims && { claims })
      });
  const del = ({
    context,
    claims,
    tokenFns: { internal: internalTokenFn, external: externalTokenFn } = {}
  } = {}) => async root =>
    await deps
      .rpc(name, domain, service, "view-store")
      .delete(root)
      .in({
        ...(context && { context })
      })
      .with({
        ...(internalTokenFn && { internalTokenFn }),
        ...(externalTokenFn && { externalTokenFn }),
        ...(claims && { claims })
      });
  return {
    set: ({ context, claims, tokenFns }) => {
      return {
        create: create({ context, claims, tokenFns }),
        read: read({ context, claims, tokenFns }),
        stream: stream({ context, claims, tokenFns }),
        update: update({ context, claims, tokenFns }),
        delete: del({ context, claims, tokenFns })
      };
    },
    create: create(),
    read: read(),
    stream: stream(),
    update: update(),
    delete: del()
  };
};
