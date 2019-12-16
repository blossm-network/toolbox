const deps = require("./deps");

module.exports = ({ name, domain, service, network }) => {
  const issue = ({ context, tokenFn } = {}) => async payload => {
    const data = { payload };
    return await deps
      .rpc(name, domain, "job")
      .post(data)
      .in({
        ...(context && { context }),
        ...(service && { service }),
        ...(network && { network })
      })
      .with({ tokenFn });
  };

  return {
    set: ({ context, tokenFn }) => {
      return {
        issue: issue({ context, tokenFn })
      };
    },
    issue: issue()
  };
};
