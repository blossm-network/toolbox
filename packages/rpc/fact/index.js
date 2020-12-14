const deps = require("./deps");

module.exports = ({ name, domain, service = process.env.SERVICE, network }) => {
  const internal = !network || network == process.env.NETWORK;
  const read = ({
    context,
    claims,
    currentToken,
    token: { internalFn: internalTokenFn, externalFn: externalTokenFn } = {},
  } = {}) => ({ query, root, raw = false, onData } = {}) =>
    deps
      .rpc(
        name,
        ...(domain ? [domain] : []),
        ...(service ? [service] : []),
        "fact"
      )
      .get(
        { ...(query && { query }), ...(root && { id: root }) },
        { raw, onData }
      )
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
        ...(claims && { claims }),
        ...(!internal && { path: `/${name}` }),
      });
  const stream = ({
    context,
    claims,
    currentToken,
    token: { internalFn: internalTokenFn, externalFn: externalTokenFn } = {},
  } = {}) => (fn, { query, root, onResponseFn, raw = false } = {}) =>
    deps
      .rpc(
        name,
        ...(domain ? [domain] : []),
        ...(service ? [service] : []),
        "fact"
      )
      .stream(
        fn,
        {
          ...(query && { query }),
          ...(root && { id: root }),
        },
        {
          ...(onResponseFn && { onResponseFn }),
          raw,
        }
      )
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
