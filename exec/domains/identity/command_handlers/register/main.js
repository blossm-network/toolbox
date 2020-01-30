const deps = require("./deps");

module.exports = async ({ payload, context, session }) => {
  // Create roots for the identity, and determine what root should be used for the principle.
  // If the session has a subject, use it as the principle root. If not, make one.
  const [identityRoot, principleRoot] = await Promise.all([
    deps.uuid(),
    session.sub || deps.uuid()
  ]);

  const events = [
    {
      root: identityRoot,
      action: "register",
      domain: "identity",
      payload: {
        phone: payload.phone,
        principle: principleRoot
      },
      correctNumber: 1
    }
  ];

  const { token } = await deps
    .command({
      action: "issue",
      domain: "challenge"
    })
    .set({
      context: {
        ...context,
        identity: identityRoot,
        principle: principleRoot
      },
      tokenFn: deps.gcpToken
    })
    .issue(
      {
        phone: payload.phone,
        email: payload.email,
        username: "tmp"
      },
      { options: { events, principle: principleRoot } }
    );

  return {
    events: [
      {
        action: "add-permissions",
        domain: "principle",
        payload: { permissions: [`identity:admin:${identityRoot}`] },
        root: principleRoot,
        correctNumber: 0
      }
    ],
    response: { token }
  };
};
