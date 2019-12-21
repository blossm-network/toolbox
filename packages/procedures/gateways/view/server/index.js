const deps = require("./deps");
const authentication = require("@blossm/authentication-middleware");

module.exports = async ({ stores, whitelist, scopesLookupFn }) => {
  let server = deps.server({
    prehook: app =>
      deps.corsMiddleware({
        app,
        whitelist,
        credentials: true,
        methods: ["GET"]
      })
  });

  for (const store of stores) {
    server = server.get(deps.get(), {
      path: `/${store.name}`,
      ...(!store.public && {
        preMiddleware: [authentication, deps.authorization({ scopesLookupFn })]
      })
    });
  }

  server.listen();
};
