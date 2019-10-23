const deps = require("./deps");
const authentication = require("@sustainers/authentication-middleware");

module.exports = async ({ whitelist, scopesLookupFn }) => {
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
      preMiddleware: [authentication, deps.authorization({ scopesLookupFn })]
    })
    .listen();
};
