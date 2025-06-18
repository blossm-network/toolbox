import deps from "./deps.js";

export default ({ name, domain, service }) => {
  const trigger = ({
    context,
    claims,
    currentToken,
    token: { internalFn: internalTokenFn, externalFn: externalTokenFn } = {},
    enqueue: { fn: enqueueFn, wait: enqueueWait } = {},
  } = {}) => (payload) => {
    const data = { payload };
    return deps
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
        ...(claims && { claims }),
        ...(enqueueFn && {
          enqueueFn: enqueueFn({
            queue: `job${service ? `-${service}` : ""}${
              domain ? `-${domain}` : ""
            }-${name}`,
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
