const deps = require("./deps");

module.exports = ({ name, domain, service = process.env.SERVICE, host }) => {
  const issue = ({ context, claims, tokenFn } = {}) => async payload => {
    const data = { payload };
    return await deps
      .rpc(name, domain, service, "job")
      .post(data)
      .in({
        ...(context && { context }),
        ...(host && { host })
      })
      .with({ tokenFn, ...(claims && { claims }) });
  };

  return {
    set: ({ context, claims, tokenFn }) => {
      return {
        issue: issue({ context, claims, tokenFn })
      };
    },
    issue: issue()
  };
};
