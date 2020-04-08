const deps = require("./deps");

module.exports = ({ name, domain, service = process.env.SERVICE, network }) => {
  const internal = !network || network == process.env.NETWORK;
  const read = ({
    context,
    claims,
    tokenFns: { internal: internalTokenFn, external: externalTokenFn } = {}
  } = {}) => async query => {
    if (query.root) {
      query.id = query.root;
      delete query.root;
    }
    return await deps
      .rpc(
        name,
        ...(domain ? [domain] : []),
        ...(service ? [service] : []),
        "fact"
      )
      .get(query)
      .in({
        ...(context && { context }),
        ...(!internal && {
          network,
          host: `fact.${domain}.${service}.${network}`
        })
      })
      .with({
        ...(internalTokenFn && { internalTokenFn }),
        ...(externalTokenFn && { externalTokenFn }),
        ...(claims && { claims })
      });
  };
  const stream = ({
    context,
    claims,
    tokenFns: { internal: internalTokenFn, external: externalTokenFn } = {}
  } = {}) => async query => {
    if (query.root) {
      query.id = query.root;
      delete query.root;
    }
    return await deps
      .rpc(
        name,
        ...(domain ? [domain] : []),
        ...(service ? [service] : []),
        "fact"
      )
      .get(query)
      .in({
        ...(context && { context }),
        ...(!internal && {
          network,
          host: `fact.${domain}.${service}.${network}`
        })
      })
      .with({
        path: "/stream",
        ...(internalTokenFn && { internalTokenFn }),
        ...(externalTokenFn && { externalTokenFn }),
        ...(claims && { claims })
      });
  };

  return {
    set: ({ context, claims, tokenFns }) => {
      return {
        read: read({ context, claims, tokenFns }),
        stream: stream({ context, claims, tokenFns })
      };
    },
    read: read(),
    stream: stream()
  };
};
