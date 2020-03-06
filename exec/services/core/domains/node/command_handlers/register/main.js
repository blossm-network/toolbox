const deps = require("./deps");

module.exports = async ({ payload, context, session }) => {
  // Create new roots for the context and the node.
  const [nodeRoot, contextRoot] = await Promise.all([deps.uuid(), deps.uuid()]);

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
        action: "add-permissions",
        root: principle,
        payload: {
          permissions: [`node:admin:${nodeRoot}`]
        }
      },
      {
        action: "register",
        root: nodeRoot,
        payload: {
          network: payload.network,
          context: contextRoot
        }
      }
    ],
    ...(tokens && { response: { tokens } })
  };
};
