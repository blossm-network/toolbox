const deps = require("./deps");

module.exports = ({ name, domain, service = process.env.SERVICE, network }) => {
  const issue = ({ context, claims, tokenFn, route = true } = {}) => async (
    payload = {},
    { trace, issued, root, path, options } = {}
  ) => {
    const internal = !network || network == process.env.NETWORK;

    const headers = {
      issued: issued || deps.dateString(),
      ...(trace != undefined && { trace }),
      path: [
        ...(path || []),
        {
          timestamp: deps.dateString(),
          ...(issued && { issued }),
          procedure: process.env.PROCEDURE,
          hash: process.env.OPERATION_HASH,
          network: process.env.NETWORK,
          host: process.env.HOST,
          ...(process.env.NAME && { name: process.env.NAME }),
          ...(process.env.DOMAIN && { domain: process.env.DOMAIN }),
          ...(process.env.SERVICE && { service: process.env.SERVICE })
        }
      ]
    };

    const data = {
      payload,
      headers,
      ...(root && { root }),
      ...(options && { options }),
      ...(!internal &&
        route && {
          destination: {
            name,
            domain,
            service,
            network
          }
        })
    };

    return await deps
      .rpc(name, domain, service, "command-handler")
      .post(data)
      .in({
        ...(context && { context }),
        ...(!internal && {
          host: route
            ? `command.antenna.${process.env.ROUTER_NETWORK}`
            : `command.${domain}.${service}.${network}`
        })
      })
      .with({
        tokenFn,
        ...(claims && { claims }),
        ...(!internal && { path: `/${name}` })
      });
  };

  return {
    set: ({ context, claims, tokenFn, route }) => {
      return {
        issue: issue({ context, claims, tokenFn, route })
      };
    },
    issue: issue()
  };
};
