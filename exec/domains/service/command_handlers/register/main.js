const deps = require("./deps");

module.exports = async ({ payload, context }) => {
  const [serviceRoot, contextRoot, principleRoot] = await Promise.all([
    deps.uuid(),
    deps.uuid(),
    context.principle || deps.uuid()
  ]);

  //just log event instead of a command handler.
  const { token } = await deps
    .command({
      action: "register",
      domain: "context"
    })
    .set({ context, tokenFn: deps.gcpToken })
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
        root: serviceRoot,
        payload: {
          name: payload.name
        },
        correctNumber: 0
      },
      {
        root: principleRoot,
        action: "add-permissions",
        domain: "principle",
        payload: {
          permissions: [`service:admin:${serviceRoot}`]
        }
      }
    ],
    response: { token }
  };
};
