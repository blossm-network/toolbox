const deps = require("./../deps");

module.exports = async ({ payload, root, context, session }) => {
  const [groupRoot, contextRoot, principleRoot] = await Promise.all([
    deps.uuid(),
    root || deps.uuid(),
    session.sub || deps.uuid()
  ]);

  const events = [
    {
      domain: "group",
      action: "add-identities",
      root: groupRoot,
      payload: {
        identities: [context.identity]
      }
    },
    {
      domain: "principle",
      action: "add-permissions",
      root: principleRoot,
      payload: {
        permissions: [
          `context:admin:${contextRoot}`,
          `group:admin:${groupRoot}`,
          `${payload.domain}:admin:${payload.root}`
        ]
      }
    },
    {
      root: contextRoot,
      payload: {
        ...payload,
        group: groupRoot
      }
    }
  ];

  if (session.sub) return { events };

  const { token } = await deps
    .command({
      domain: "session",
      action: "upgrade"
    })
    .set({ context, session, tokenFn: deps.tokenFn })
    .issue({
      principle: principleRoot
    });

  return { events, response: { token } };
};
