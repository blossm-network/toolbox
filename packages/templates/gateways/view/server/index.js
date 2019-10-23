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
          methods: ["GET"]
        })
    })
    .get(deps.get(), {
      path: "/:domain/:name",
      preMiddleware: [authentication, deps.authorization({ scopesLookupFn })]
    })
    .listen();
};
