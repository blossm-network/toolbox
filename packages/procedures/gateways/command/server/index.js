const deps = require("./deps");
const authentication = require("@blossm/authentication-middleware");

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
    .post(deps.post(), {
      path: "/:domain/:action",
      preMiddleware: [authentication, deps.authorization({ scopesLookupFn })]
    })
    .listen();
};
