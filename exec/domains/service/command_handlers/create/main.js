const deps = require("./deps");

module.exports = async ({ payload, context }) => {
  const [serviceRoot, contextRoot, principleRoot] = await Promise.all([
    deps.uuid(),
    deps.uuid(),
    context.principle || deps.uuid()
  ]);

  const { token } = await deps
    .command({
      action: "create",
      domain: "context"
    })
    .set({ context, token: deps.gcpToken })
    .issue(
      {
        root: serviceRoot,
        domain: process.env.DOMAIN,
        service: process.env.SERVICE,
        network: process.env.NETWORK
      },
      { root: contextRoot }
    );

  // const { token } = await deps
  //   .command({
  //     action: "enter",
  //     domain: "context"
  //   })
  //   .set({ context, token: deps.gcpToken })
  //   .issue({}, { root: contextRoot });

  return {
    events: [
      {
        root: principleRoot,
        action: "add-permissions",
        domain: "principle",
        payload: {
          permissions: [`service:admin:${serviceRoot}`]
        }
      },
      {
        root: serviceRoot,
        payload: {
          context: contextRoot,
          name: payload.name
        },
        correctNumber: 0
      }
    ],
    response: { token }
  };
};
