const { string: dateString } = require("@blossm/datetime");

const deps = require("./deps");

module.exports = ({ name, domain, service = process.env.SERVICE, host }) => {
  const issue = ({ context, claims, tokenFn } = {}) => async (
    payload,
    { trace, source, issued, root, options } = {}
  ) => {
    const internal = !host || host == process.env.HOST;

    //TODO
    //eslint-disable-next-line no-console
    console.log({
      commandRpcInternal: internal,
      host,
      processHost: process.env.HOST
    });

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
      .rpc(name, domain, service, "command-handler")
      .post(data)
      .in({
        ...(context && { context }),
        ...(host && {
          host: internal ? host : `command.${domain}.${service}.${host}`
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
