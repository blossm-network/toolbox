const deps = require("./deps");

module.exports = async ({ payload, context, session }) => {
  // Create new roots for the context and the node.
  const nodeRoot = deps.uuid();
  const contextRoot = deps.uuid();

  // Register the context.
  const { tokens, principle } = await deps
    .command({
      name: "register",
      domain: "context"
    })
    .set({ context, session, tokenFn: deps.gcpToken })
    .issue(
      {
        root: nodeRoot,
        domain: process.env.DOMAIN,
        service: process.env.SERVICE,
        network: process.env.NETWORK
      },
      { root: contextRoot }
    );

  return {
    events: [
      {
        domain: "principle",
        service: principle.service,
        network: principle.network,
        action: "add-roles",
        root: principle.root,
        payload: {
          roles: [
            {
              id: "NodeAdmin",
              service: process.env.SERVICE,
              network: process.env.NETWORK
            }
          ]
        }
      },
      {
        action: "register",
        root: nodeRoot,
        payload: {
          network: payload.network,
          context: {
            root: contextRoot,
            service: process.env.SERVICE,
            network: process.env.NETWORK
          }
        }
      }
    ],
    ...(tokens && { response: { tokens } })
  };
};
