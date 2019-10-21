const { string: dateString } = require("@sustainers/datetime");

const deps = require("./deps");

module.exports = ({ action, domain, service, network }) => {
  const issue = ({ context, tokenFn } = {}) => async (
    payload,
    { trace, source } = {}
  ) => {
    const headers = {
      issued: dateString(),
      ...(trace != undefined && { trace }),
      ...(source != undefined && { source })
    };

    const data = { payload, headers };
    await deps
      .operation(action, domain, "command-handler")
      .post(data)
      .in({ ...(context && { context }), service, network })
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
