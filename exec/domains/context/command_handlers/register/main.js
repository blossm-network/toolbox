const deps = require("./../deps");

module.exports = async ({ payload, root, context, session }) => {
  // Create a root for the context, and determine what root should be used for the principle.
  const [contextRoot, principleRoot] = await Promise.all([
    root || deps.uuid(),
    session.sub || deps.uuid()
  ]);

  // Give the principle admin priviledges to this context.
  const events = [
    {
      domain: "principle",
      action: "add-permissions",
      root: principleRoot,
      payload: {
        permissions: [`context:admin:${contextRoot}`]
      }
    },
    {
      root: contextRoot,
      payload
    }
  ];

  const response = { principle: principleRoot };

  // If the session already has a subject, no need to upgrade it.
  if (session.sub) return { events, response };

  // Upgrade the session for the principle.
  const { token } = await deps
    .command({
      domain: "session",
      action: "upgrade"
    })
    .set({ context, session, tokenFn: deps.tokenFn })
    .issue({ principle: principleRoot });

  return { events, response: { ...response, token } };
};
