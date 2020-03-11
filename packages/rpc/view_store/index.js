const deps = require("./deps");

module.exports = ({ name, domain, service, network }) => {
  const create = ({ context, claims, tokenFn } = {}) => async view =>
    await deps
      .rpc(name, domain, "view-store")
      .post({ view })
      .in({
        ...(context && { context }),
        ...(service && { service }),
        ...(network && { network })
      })
      .with({
        tokenFn,
        ...(claims && { claims })
      });
  const read = ({ context, claims, tokenFn } = {}) => async ({ query, sort }) =>
    await deps
      .rpc(name, domain, "view-store")
      .get({ query, ...(sort && { sort }) })
      .in({
        ...(context && { context }),
        ...(service && { service }),
        ...(network && { network })
      })
      .with({ tokenFn, ...(claims && { claims }) });
  const stream = ({ context, claims, tokenFn } = {}) => async ({
    query,
    sort
  }) =>
    await deps
      .rpc(name, domain, "view-store")
      .get({ query, ...(sort && { sort }) })
      .in({
        ...(context && { context }),
        ...(service && { service }),
        ...(network && { network })
      })
      .with({
        path: "/stream",
        ...(tokenFn && { tokenFn }),
        ...(claims && { claims })
      });
  const update = ({ context, claims, tokenFn } = {}) => async (root, view) =>
    await deps
      .rpc(name, domain, "view-store")
      .put(root, { view })
      .in({
        ...(context && { context }),
        ...(service && { service }),
        ...(network && { network })
      })
      .with({ tokenFn, ...(claims && { claims }) });
  const del = ({ context, claims, tokenFn } = {}) => async root =>
    await deps
      .rpc(name, domain, "view-store")
      .delete(root)
      .in({
        ...(context && { context }),
        ...(service && { service }),
        ...(network && { network })
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
