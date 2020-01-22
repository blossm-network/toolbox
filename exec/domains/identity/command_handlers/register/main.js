const deps = require("./deps");

module.exports = async ({ payload, context }) => {
  const [identityRoot, principleRoot] = await Promise.all([
    deps.uuid(),
    context.principle || deps.uuid() // A principle may already have access to contexts.
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
        phone: payload.phone
      },
      { options: { events, exists: false } }
    );

  return {
    events: [
      {
        action: "add-permissions",
        domain: "principle",
        payload: { permissions: [`identity:admin:${identityRoot}`] },
        root: principleRoot,
        correctNumber: 0
      },
      {
        action: "attempt-register",
        payload: {},
        root: identityRoot,
        correctNumber: 0
      }
    ],
    response: { token }
  };
};
