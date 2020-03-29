const { string: dateString } = require("@blossm/datetime");

const deps = require("./deps");

module.exports = ({ name, domain, service = process.env.SERVICE, network }) => {
  const issue = ({ context, claims, tokenFn } = {}) => async (
    payload,
    { trace, source, issued, accepted, broadcasted, root, options } = {}
  ) => {
    const internal = !network || network == process.env.NETWORK;

    const headers = {
      id: deps.uuid(),
      issued: issued || dateString(),
      ...(accepted != undefined && { accepted }),
      ...(broadcasted != undefined && { broadcasted }),
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
      .rpc(name, domain, service, "command-handler")
      .post(data)
      .in({
        ...(context && { context }),
        ...(!internal && {
          host: `command.${domain}.${service}.${network}`
        })
      })
      .with({
        tokenFn,
        ...(claims && { claims }),
        ...(!internal && { path: `/${name}` })
      });
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
