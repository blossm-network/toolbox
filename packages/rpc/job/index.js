const deps = require("./deps");

module.exports = ({ name, domain, service }) => {
  const trigger = ({
    context,
    claims,
    currentToken,
    token: {
      internalFn: internalTokenFn,
      externalFn: externalTokenFn,
      key,
    } = {},
    enqueue: { fn: enqueueFn, wait: enqueueWait } = {},
  } = {}) => async (payload) => {
    const data = { payload };
    return await deps
      .rpc(
        name,
        ...(domain ? [domain] : []),
        ...(service ? [service] : []),
        "job"
      )
      .post(data)
      .in({
        ...(context && { context }),
      })
      .with({
        ...(internalTokenFn && { internalTokenFn }),
        ...(externalTokenFn && { externalTokenFn }),
        ...(currentToken && { currentToken }),
        ...(key && { key }),
        ...(claims && { claims }),
        ...(enqueueFn && {
          enqueueFn: enqueueFn({
            queue: `j${service ? `.${service}` : ""}${
              domain ? `.${domain}` : ""
            }.${name}`,
            ...(enqueueWait && { wait: enqueueWait }),
          }),
        }),
      });
  };

  return {
    set: ({ context, claims, token, currentToken, enqueue }) => {
      return {
        trigger: trigger({ context, claims, token, currentToken, enqueue }),
      };
    },
    trigger: trigger(),
  };
};
