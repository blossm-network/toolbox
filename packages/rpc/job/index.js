const deps = require("./deps");

module.exports = ({ name, domain, service = process.env.SERVICE }) => {
  const trigger = ({
    context,
    claims,
    tokenFns: { internal: internalTokenFn, external: externalTokenFn } = {}
  } = {}) => async payload => {
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
        ...(context && { context })
      })
      .with({
        ...(internalTokenFn && { internalTokenFn }),
        ...(externalTokenFn && { externalTokenFn }),
        ...(claims && { claims })
      });
  };

  return {
    set: ({ context, claims, tokenFns }) => {
      return {
        trigger: trigger({ context, claims, tokenFns })
      };
    },
    trigger: trigger()
  };
};
