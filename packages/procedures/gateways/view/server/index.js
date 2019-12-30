const deps = require("./deps");

module.exports = async ({
  stores,
  domain = process.env.DOMAIN,
  whitelist,
  permissionsLookupFn,
  verifyFn
}) => {
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
    server = server.get(deps.get({ name: store.name, domain }), {
      path: `/${store.name}`,
      ...(store.priviledges != "none" && {
        preMiddleware: [
          deps.authentication({ verifyFn }),
          deps.authorization({
            permissionsLookupFn,
            priviledges: store.priviledges
          })
        ]
      })
    });
  }

  server.listen();
};
