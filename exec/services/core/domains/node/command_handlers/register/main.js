const deps = require("./deps");

module.exports = async ({ payload, context, claims }) => {
  // Create new roots for the scene and the node.
  const nodeRoot = deps.uuid();
  const sceneRoot = deps.uuid();

  // Register the scene.
  const { tokens, principle } = await deps
    .command({
      name: "register",
      domain: "scene"
    })
    .set({ context, claims, tokenFn: deps.gcpToken })
    .issue(
      {
        root: nodeRoot,
        domain: process.env.DOMAIN,
        service: process.env.SERVICE,
        network: process.env.NETWORK
      },
      { root: sceneRoot }
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
          scene: {
            root: sceneRoot,
            service: process.env.SERVICE,
            network: process.env.NETWORK
          }
        }
      }
    ],
    response: { ...(tokens && { tokens }), roots: { node: nodeRoot } }
  };
};
