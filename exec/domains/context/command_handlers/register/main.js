const deps = require("./deps");

module.exports = async ({ payload, root, context, session }) => {
  // Create a root for the context, and determine what root should be used for the principle.
  const principleRoot = session.sub || (await deps.uuid());

  // Give the principle admin priviledges to this context.
  const events = [
    {
      domain: "principle",
      action: "add-permissions",
      root: principleRoot,
      payload: {
        permissions: [`context:admin:${root}`]
      }
    },
    {
      root,
      payload
    }
  ];

  const response = { principle: principleRoot };

  // If the session already has a subject, no need to upgrade it.
  if (session.sub) return { events, response };

  // Upgrade the session for the principle.
  const { tokens } = await deps
    .command({
      domain: "session",
      action: "upgrade"
    })
    .set({ context, session, tokenFn: deps.gcpToken })
    .issue({ principle: principleRoot }, { root: context.session });

  return { events, response: { ...response, tokens } };
};
