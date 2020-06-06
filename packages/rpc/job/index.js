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
      });
  };

  return {
    set: ({ context, claims, token, currentToken }) => {
      return {
        trigger: trigger({ context, claims, token, currentToken }),
      };
    },
    trigger: trigger(),
  };
};
