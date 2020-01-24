const deps = require("./deps");

module.exports = ({ name, domain, service, network }) => {
  const issue = ({ context, session, tokenFn } = {}) => async payload => {
    const data = { payload };
    return await deps
      .rpc(name, domain, "job")
      .post(data)
      .in({
        ...(context && { context }),
        ...(session && { session }),
        ...(service && { service }),
        ...(network && { network })
      })
      .with({ tokenFn });
  };

  return {
    set: ({ context, session, tokenFn }) => {
      return {
        issue: issue({ context, session, tokenFn })
      };
    },
    issue: issue()
  };
};
