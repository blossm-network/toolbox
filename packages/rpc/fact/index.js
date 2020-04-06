const deps = require("./deps");

module.exports = ({ name, domain, service = process.env.SERVICE }) => {
  const read = ({ context, claims, tokenFn } = {}) => async query =>
    await deps
      .rpc(
        name,
        ...(domain ? [domain] : []),
        ...(service ? [service] : []),
        "fact"
      )
      .get({ query })
      .in({
        ...(context && { context })
      })
      .with({
        ...(tokenFn && { tokenFn }),
        ...(claims && { claims })
      });
  const stream = ({ context, claims, tokenFn } = {}) => async query =>
    await deps
      .rpc(
        name,
        ...(domain ? [domain] : []),
        ...(service ? [service] : []),
        "fact"
      )
      .get({ query })
      .in({
        ...(context && { context })
      })
      .with({
        path: "/stream",
        ...(tokenFn && { tokenFn }),
        ...(claims && { claims })
      });

  return {
    set: ({ context, claims, tokenFn }) => {
      return {
        read: read({ context, claims, tokenFn }),
        stream: stream({ context, claims, tokenFn })
      };
    },
    read: read(),
    stream: stream()
  };
};
