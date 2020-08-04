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
    {
      root,
      options,
      headers: { idempotency } = {},
      tx: { ip, id, path } = {},
    } = {}
  ) => {
    const headers = {
      issued: deps.dateString(),
      ...(idempotency && { idempotency }),
    };

    const tx = {
      ...(ip && { ip }),
      ...(id && { id }),
      ...(path && { path }),
    };

    const data = {
      payload,
      headers,
      tx,
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
            queue: `command-${service}-${domain}-${name}`,
            ...(enqueueWait && { wait: enqueueWait }),
          }),
        }),
        ...(key && { key }),
        ...(claims && { claims }),
        ...(!internal && {
          // process.env.NODE_ENV != "local" && //TODO test
          path: `/${name}`,
        }),
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
