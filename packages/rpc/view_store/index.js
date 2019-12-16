const deps = require("./deps");

module.exports = ({ name, domain, service, network }) => {
  const create = ({ context, tokenFn } = {}) => async properties =>
    await deps
      .rpc(name, domain, "view-store")
      .post(properties)
      .in({
        ...(context && { context }),
        ...(service && { service }),
        ...(network && { network })
      })
      .with({ tokenFn });
  const read = ({ context, tokenFn } = {}) => async query =>
    await deps
      .rpc(name, domain, "view-store")
      .get(query)
      .in({
        ...(context && { context }),
        ...(service && { service }),
        ...(network && { network })
      })
      .with({ tokenFn });
  const stream = ({ context, tokenFn } = {}) => async query =>
    await deps
      .rpc(name, domain, "view-store")
      .get(query)
      .in({
        ...(context && { context }),
        ...(service && { service }),
        ...(network && { network })
      })
      .with({ path: "/stream", ...(tokenFn && { tokenFn }) });
  const update = ({ context, tokenFn } = {}) => async (root, properties) =>
    await deps
      .rpc(name, domain, "view-store")
      .put(root, properties)
      .in({
        ...(context && { context }),
        ...(service && { service }),
        ...(network && { network })
      })
      .with({ tokenFn });
  const del = ({ context, tokenFn } = {}) => async root =>
    await deps
      .rpc(name, domain, "view-store")
      .delete(root)
      .in({
        ...(context && { context }),
        ...(service && { service }),
        ...(network && { network })
      })
      .with({ tokenFn });
  return {
    set: ({ context, tokenFn }) => {
      return {
        create: create({ context, tokenFn }),
        read: read({ context, tokenFn }),
        stream: stream({ context, tokenFn }),
        update: update({ context, tokenFn }),
        delete: del({ context, tokenFn })
      };
    },
    create: create(),
    read: read(),
    stream: stream(),
    update: update(),
    delete: del()
  };
};
