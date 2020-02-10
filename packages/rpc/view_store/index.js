const deps = require("./deps");

module.exports = ({ name, domain, service, network }) => {
  const create = ({ context, session, tokenFn } = {}) => async properties =>
    await deps
      .rpc(name, domain, "view-store")
      .post(properties)
      .in({
        ...(context && { context }),
        ...(session && { session }),
        ...(service && { service }),
        ...(network && { network })
      })
      .with({ tokenFn });
  const read = ({ context, session, tokenFn } = {}) => async ({
    query,
    sort
  }) =>
    await deps
      .rpc(name, domain, "view-store")
      .get({ query, ...(sort && { sort }) })
      .in({
        ...(context && { context }),
        ...(session && { session }),
        ...(service && { service }),
        ...(network && { network })
      })
      .with({ tokenFn });
  const stream = ({ context, session, tokenFn } = {}) => async ({
    query,
    sort
  }) =>
    await deps
      .rpc(name, domain, "view-store")
      .get({ query, sort })
      .in({
        ...(context && { context }),
        ...(session && { session }),
        ...(service && { service }),
        ...(network && { network })
      })
      .with({ path: "/stream", ...(tokenFn && { tokenFn }) });
  const update = ({ context, session, tokenFn } = {}) => async (
    root,
    properties
  ) =>
    await deps
      .rpc(name, domain, "view-store")
      .put(root, properties)
      .in({
        ...(context && { context }),
        ...(session && { session }),
        ...(service && { service }),
        ...(network && { network })
      })
      .with({ tokenFn });
  const del = ({ context, session, tokenFn } = {}) => async root =>
    await deps
      .rpc(name, domain, "view-store")
      .delete(root)
      .in({
        ...(context && { context }),
        ...(session && { session }),
        ...(service && { service }),
        ...(network && { network })
      })
      .with({ tokenFn });
  return {
    set: ({ context, session, tokenFn }) => {
      return {
        create: create({ context, session, tokenFn }),
        read: read({ context, session, tokenFn }),
        stream: stream({ context, session, tokenFn }),
        update: update({ context, session, tokenFn }),
        delete: del({ context, session, tokenFn })
      };
    },
    create: create(),
    read: read(),
    stream: stream(),
    update: update(),
    delete: del()
  };
};
