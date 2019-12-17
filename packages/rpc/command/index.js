const { string: dateString } = require("@blossm/datetime");

const deps = require("./deps");

module.exports = ({ action, domain, service, network }) => {
  const issue = ({ context, tokenFn } = {}) => async (
    payload,
    { trace, source, issued } = {}
  ) => {
    const headers = {
      id: deps.uuid(),
      issued: issued || dateString(),
      ...(trace != undefined && { trace }),
      ...(source != undefined && { source })
    };

    const data = { payload, headers };
    return await deps
      .rpc(action, domain, "command-handler")
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
