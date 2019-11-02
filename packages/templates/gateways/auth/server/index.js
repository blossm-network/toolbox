const deps = require("./deps");

module.exports = async ({
  whitelist,
  scopesLookupFn,
  priviledgesLookupFn,
  verifyFn
}) => {
  deps
    .server({
      prehook: app =>
        deps.corsMiddleware({
          app,
          whitelist,
          credentials: true,
          methods: ["POST"]
        })
    })
    .post(deps.post({ action: "issue", domain: process.env.DOMAIN }), {
      path: `/${process.env.DOMAIN}/issue`
    })
    .post(deps.post({ action: "answer", domain: process.env.DOMAIN }), {
      path: `/${process.env.DOMAIN}/answer`,
      preMiddleware: [
        deps.authentication({ verifyFn }),
        deps.authorization({
          domain: process.env.DOMAIN,
          service: process.env.SERVICE,
          network: process.env.NETWORK,
          scopesLookupFn,
          priviledgesLookupFn
        })
      ]
    })
    .listen();
};
