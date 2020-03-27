const deps = require("./deps");

module.exports = ({ name, domain, service = process.env.SERVICE, network }) => {
  const internal = !network || network == process.env.NETWORK;
  const create = ({ context, claims, tokenFn } = {}) => async view =>
    await deps
      .rpc(name, domain, service, "view-store")
      .post({ view })
      .in({
        ...(context && { context })
      })
      .with({
        tokenFn,
        ...(claims && { claims })
      });
  const read = ({ context, claims, tokenFn } = {}) => async ({ query, sort }) =>
    await deps
      .rpc(name, domain, service, "view-store")
      .get({ query, ...(sort && { sort }) })
      .in({
        ...(context && { context }),
        ...(!internal && {
          host: `view.${domain}.${service}.${network}`
        })
      })
      .with({
        tokenFn,
        ...(claims && { claims }),
        ...(!internal && { path: `/${name}` })
      });
  const stream = ({ context, claims, tokenFn } = {}) => async ({
    query,
    sort
  }) =>
    await deps
      .rpc(name, domain, service, "view-store")
      .get({ query, ...(sort && { sort }) })
      .in({
        ...(context && { context }),
        ...(!internal && {
          host: `view.${domain}.${service}.${network}`
        })
      })
      .with({
        path: `/${internal ? "" : `${name}/`}stream`,
        ...(tokenFn && { tokenFn }),
        ...(claims && { claims })
      });
  const update = ({ context, claims, tokenFn } = {}) => async (root, view) =>
    await deps
      .rpc(name, domain, service, "view-store")
      .put(root, { view })
      .in({
        ...(context && { context })
      })
      .with({ tokenFn, ...(claims && { claims }) });
  const del = ({ context, claims, tokenFn } = {}) => async root =>
    await deps
      .rpc(name, domain, service, "view-store")
      .delete(root)
      .in({
        ...(context && { context })
      })
      .with({ tokenFn, ...(claims && { claims }) });
  return {
    set: ({ context, claims, tokenFn }) => {
      return {
        create: create({ context, claims, tokenFn }),
        read: read({ context, claims, tokenFn }),
        stream: stream({ context, claims, tokenFn }),
        update: update({ context, claims, tokenFn }),
        delete: del({ context, claims, tokenFn })
      };
    },
    create: create(),
    read: read(),
    stream: stream(),
    update: update(),
    delete: del()
  };
};
