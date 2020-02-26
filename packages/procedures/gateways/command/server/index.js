const deps = require("./deps");

module.exports = async ({
  commands,
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
        methods: ["POST"]
      })
  });

  for (const {
    name,
    key = "auth",
    permissions,
    protected = true
  } of commands) {
    server = server.post(deps.post({ name, domain }), {
      path: `/${name}`,
      ...(protected && {
        preMiddleware: [
          deps.authentication({
            verifyFn: verifyFn({ key })
          }),
          deps.authorization({
            permissionsLookupFn,
            terminatedSessionCheckFn,
            permissions
          })
        ]
      })
    });
  }

  server.listen();
};
