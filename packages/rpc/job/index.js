const deps = require("./deps");

module.exports = ({ name, domain, service, network }) => {
  const issue = ({ context, claims, tokenFn } = {}) => async payload => {
    const data = { payload };
    return await deps
      .rpc(name, domain, "job")
      .post(data)
      .in({
        ...(context && { context }),
        ...(service && { service }),
        ...(network && { network })
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
