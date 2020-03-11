const deps = require("./deps");

module.exports = async ({ payload, root, context, claims }) => {
  // Determine what root should be used for the principle.
  const principle = context.principle || {
    root: deps.uuid(),
    service: process.env.SERVICE,
    network: process.env.NETWORK
  };

  // Give the principle admin priviledges to this context.
  const events = [
    {
      domain: "principle",
      service: principle.service,
      network: principle.network,
      action: "add-roles",
      root: principle.root,
      payload: {
        roles: [
          {
            id: "SceneAdmin",
            service: process.env.SERVICE,
            network: process.env.NETWORK
          }
        ]
      }
    },
    {
      domain: "principle",
      service: principle.service,
      network: principle.network,
      action: "add-scenes",
      root: principle.root,
      payload: {
        scenes: [
          {
            root,
            service: process.env.SERVICE,
            network: process.env.NETWORK
          }
        ]
      }
    },
    {
      action: "register",
      root,
      payload,
      correctNumber: 0
    }
  ];

  const response = { principle };

  // If the session already has a principle, no need to upgrade it.
  if (context.principle) return { events, response };

  // Upgrade the session for the principle.
  const { tokens } = await deps
    .command({
      domain: "session",
      name: "upgrade"
    })
    .set({ context, claims, tokenFn: deps.gcpToken })
    .issue({ principle }, { root: context.session });

  return { events, response: { ...response, tokens } };
};
