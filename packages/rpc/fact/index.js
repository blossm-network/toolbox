import deps from "./deps.js";

export default ({ name, domain, service = process.env.SERVICE, region = process.env.REGION, network }) => {
  const internal = !network || network == process.env.NETWORK;
  const read = ({
    context,
    claims,
    currentToken,
    token: { internalFn: internalTokenFn, externalFn: externalTokenFn } = {},
  } = {}) => ({ query, root, raw = false } = {}) =>
    deps
      .rpc({
        region,
        operationNameComponents: [name, ...(domain ? [domain] : []), ...(service ? [service] : []), "fact"]
      })
      .get({ ...(query && { query }), ...(root && { id: root }) }, { raw })
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
  } = {}) => (fn, { query, root, raw = false } = {}) =>
    deps
      .rpc({
        region,
        operationNameComponents: [name, ...(domain ? [domain] : []), ...(service ? [service] : []), "fact"]
      })
      .stream(
        fn,
        {
          ...(query && { query }),
          ...(root && { id: root }),
        },
        {
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
