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
    queue: { fn: queueFn, wait: queueWait } = {},
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
        ...(queueFn && {
          queueFn: queueFn({ queue: `${name}.${domain}.${service}` }),
        }),
        ...(key && { key }),
        ...(claims && { claims }),
        ...(queueFn && {
          queueFn: queueFn({
            queue: `j${service ? `.${service}` : ""}${
              domain ? `.${domain}` : ""
            }.${name}`,
            ...(queueWait && { wait: queueWait }),
          }),
        }),
      });
  };

  return {
    set: ({ context, claims, token, currentToken, queue }) => {
      return {
        trigger: trigger({ context, claims, token, currentToken, queue }),
      };
    },
    trigger: trigger(),
  };
};
