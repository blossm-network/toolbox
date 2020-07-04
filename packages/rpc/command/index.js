const deps = require("./deps");

module.exports = ({ name, domain, service = process.env.SERVICE, network }) => {
  const internal = !network || network == process.env.NETWORK;
  const issue = ({
    context,
    claims,
    currentToken,
    token: {
      internalFn: internalTokenFn,
      externalFn: externalTokenFn,
      key,
    } = {},
    enqueue: { fn: enqueueFn, wait: enqueueWait } = {},
  } = {}) => (
    payload = {},
    { root, options, headers: { trace, idempotency, path } = {} } = {}
  ) => {
    const headers = {
      issued: deps.dateString(),
      ...(trace && { trace }),
      ...(idempotency && { idempotency }),
      ...(path && { path }),
    };

    const data = {
      payload,
      headers,
      ...(root && { root }),
      ...(options && { options }),
    };

    return deps
      .rpc(name, domain, service, "command")
      .post(data)
      .in({
        ...(context && { context }),
        ...(!internal && {
          network,
          host: `c.${domain}.${service}.${network}`,
        }),
      })
      .with({
        ...(internalTokenFn && { internalTokenFn }),
        ...(externalTokenFn && { externalTokenFn }),
        ...(currentToken && { currentToken }),
        ...(enqueueFn && {
          enqueueFn: enqueueFn({
            queue: `c-${service}-${domain}-${name}`,
            ...(enqueueWait && { wait: enqueueWait }),
          }),
        }),
        ...(key && { key }),
        ...(claims && { claims }),
        ...(!internal && { path: `/${name}` }),
      });
  };

  return {
    set: ({ context, claims, token, currentToken, enqueue }) => {
      return {
        issue: issue({
          context,
          claims,
          token,
          currentToken,
          enqueue,
        }),
      };
    },
    issue: issue(),
  };
};
