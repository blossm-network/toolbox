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
    .post(deps.post({ action: "issue", domain: "challenge" }), {
      path: "/challenge/issue"
    })
    .post(deps.post({ action: "answer", domain: "challenge" }), {
      path: "/challenge/answer",
      preMiddleware: [
        deps.authentication({ verifyFn }),
        deps.authorization({
          domain: "challenge",
          service: process.env.SERVICE,
          network: process.env.NETWORK,
          scopesLookupFn,
          priviledgesLookupFn
        })
      ]
    })
    .listen();
};
