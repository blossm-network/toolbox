const deps = require("./deps");

module.exports = ({ name, domain, service = process.env.SERVICE }) => {
  const trigger = ({
    context,
    claims,
    currentToken,
    token: {
      internalFn: internalTokenFn,
      externalFn: externalTokenFn,
      key,
    } = {},
    queueFn,
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
        ...(queueFn && { queueFn }),
      });
  };

  return {
    set: ({ context, claims, token, currentToken, queueFn }) => {
      return {
        trigger: trigger({ context, claims, token, currentToken, queueFn }),
      };
    },
    trigger: trigger(),
  };
};
