const deps = require("./deps");

module.exports = async ({ payload, context, session }) => {
  // Create new roots for the context, the service, and the group.
  const [groupRoot, serviceRoot, contextRoot] = await Promise.all([
    deps.uuid(),
    deps.uuid(),
    deps.uuid()
  ]);

  // Register the context.
  const { tokens, principle } = await deps
    .command({
      action: "register",
      domain: "context"
    })
    .set({ context, session, tokenFn: deps.gcpToken })
    .issue(
      {
        root: serviceRoot,
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
          permissions: [
            `group:admin:${groupRoot}`,
            `service:admin:${serviceRoot}`
          ]
        }
      },
      {
        domain: "group",
        action: "add-identities",
        payload: {
          identities: [context.identity]
        },
        root: groupRoot
      },
      {
        root: serviceRoot,
        payload: {
          name: payload.name,
          group: groupRoot,
          context: contextRoot
        }
      }
    ],
    ...(tokens && { response: { tokens } })
  };
};
