const { string: dateString } = require("@blossm/datetime");

const deps = require("./deps");

module.exports = ({ name, domain, service, network }) => {
  const issue = ({ context, claims, tokenFn } = {}) => async (
    payload,
    { trace, source, issued, root, options } = {}
  ) => {
    const headers = {
      id: deps.uuid(),
      issued: issued || dateString(),
      ...(trace != undefined && { trace }),
      ...(source != undefined && { source })
    };

    const data = {
      payload,
      headers,
      ...(root && { root }),
      ...(options && { options })
    };
    return await deps
      .rpc(name, domain, "command-handler")
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
