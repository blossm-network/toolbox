const deps = require("./deps");

module.exports = async ({ payload, context }) => {
  const identityRoot = deps.uuid();
  const principleRoot = deps.uuid();

  const events = [
    {
      root: identityRoot,
      action: "register",
      domain: "identity",
      payload: {
        phone: payload.phone
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
        payload: {
          phone: payload.phone,
          principle: principleRoot
        },
        root: identityRoot,
        correctNumber: 0
      }
    ],
    response: { token }
  };
};
