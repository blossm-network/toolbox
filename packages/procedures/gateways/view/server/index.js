const deps = require("./deps");

module.exports = async ({
  stores,
  domain = process.env.DOMAIN,
  whitelist,
  permissionsLookupFn,
  terminatedSessionCheckFn,
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

  for (const { name, key = "auth", priviledges, protected = true } of stores) {
    server = server.get(deps.get({ name, domain }), {
      path: `/${name}`,
      ...(protected && {
        preMiddleware: [
          deps.authentication({
            verifyFn: verifyFn({ key })
          }),
          deps.authorization({
            permissionsLookupFn,
            terminatedSessionCheckFn,
            priviledges
          })
        ]
      })
    });
  }

  server.listen();
};
