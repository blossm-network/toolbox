const deps = require("./deps");

module.exports = ({ name, domain, service = process.env.SERVICE, network }) => {
  const internal = !network || network == process.env.NETWORK;
  const read = ({
    context,
    claims,
    currentToken,
    token: {
      internalFn: internalTokenFn,
      externalFn: externalTokenFn,
      key,
    } = {},
  } = {}) => ({ query, id } = {}) =>
    deps
      .rpc(
        name,
        ...(domain ? [domain] : []),
        ...(service ? [service] : []),
        "fact"
      )
      .get({ ...(query && { query }), ...(id && { id }) })
      .in({
        ...(context && { context }),
        ...(!internal && {
          network,
          host: `f.${domain}.${service}.${network}`,
        }),
      })
      .with({
        ...(internalTokenFn && { internalTokenFn }),
        ...(externalTokenFn && { externalTokenFn }),
        ...(currentToken && { currentToken }),
        ...(key && { key }),
        ...(claims && { claims }),
        ...(!internal && { path: `/${name}` }),
      });
  const stream = ({
    context,
    claims,
    currentToken,
    token: {
      internalFn: internalTokenFn,
      externalFn: externalTokenFn,
      key,
    } = {},
  } = {}) => (fn, { query, id } = {}) =>
    deps
      .rpc(
        name,
        ...(domain ? [domain] : []),
        ...(service ? [service] : []),
        "fact"
      )
      .stream(fn, { ...(query && { query }), ...(id && { id }) })
      .in({
        ...(context && { context }),
        ...(!internal && {
          network,
          host: `f.${domain}.${service}.${network}`,
        }),
      })
      .with({
        path: "/stream",
        ...(internalTokenFn && { internalTokenFn }),
        ...(externalTokenFn && { externalTokenFn }),
        ...(currentToken && { currentToken }),
        ...(key && { key }),
        ...(claims && { claims }),
      });

  return {
    set: ({ context, claims, token, currentToken }) => {
      return {
        read: read({ context, claims, token, currentToken }),
        stream: stream({ context, claims, token, currentToken }),
      };
    },
    read: read(),
    stream: stream(),
  };
};
