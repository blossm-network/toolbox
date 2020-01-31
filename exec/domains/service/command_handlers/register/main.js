const deps = require("./deps");

module.exports = async ({ payload, context, session }) => {
  const [serviceRoot, contextRoot] = await Promise.all([
    deps.uuid(),
    deps.uuid()
  ]);

  //just log event instead of a command handler.
  const response = await deps
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
        root: serviceRoot,
        payload: {
          name: payload.name,
          context: contextRoot
        },
        correctNumber: 0
      }
    ],
    ...(response && { response })
  };
};
