const deps = require("./deps");

module.exports = ({ name, domain, service = process.env.SERVICE }) => {
  const trigger = ({ context, claims, tokenFn } = {}) => async payload => {
    const data = { payload };
    return await deps
      .rpc(
        name,
        ...(domain ? [domain] : []),
        ...(service ? [service] : []),
        "post-job"
      )
      .post(data)
      .in({
        ...(context && { context })
      })
      .with({ tokenFn, ...(claims && { claims }) });
  };

  return {
    set: ({ context, claims, tokenFn }) => {
      return {
        trigger: trigger({ context, claims, tokenFn })
      };
    },
    trigger: trigger()
  };
};
