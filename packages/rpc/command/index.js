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
  } = {}) => async (
    payload = {},
    { trace, issued, root, path, options } = {}
  ) => {
    const headers = {
      issued: issued || deps.dateString(),
      ...(trace != undefined && { trace }),
      path: [
        ...(path || []),
        {
          timestamp: deps.dateString(),
          ...(issued && { issued }),
          procedure: process.env.PROCEDURE,
          hash: process.env.OPERATION_HASH,
          network: process.env.NETWORK,
          host: process.env.HOST,
          ...(process.env.NAME && { name: process.env.NAME }),
          ...(process.env.DOMAIN && { domain: process.env.DOMAIN }),
          ...(process.env.SERVICE && { service: process.env.SERVICE }),
        },
      ],
    };

    const data = {
      payload,
      headers,
      ...(root && { root }),
      ...(options && { options }),
    };

    return await deps
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
            queue: `c.${service}.${domain}.${name}`,
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
        issue: issue({ context, claims, token, currentToken, enqueue }),
      };
    },
    issue: issue(),
  };
};
