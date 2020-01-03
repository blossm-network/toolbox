const deps = require("./deps");

module.exports = async ({
  commands,
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
        methods: ["POST"]
      })
  });

  for (const command of commands) {
    server = server.post(deps.post({ action: command.action, domain }), {
      path: `/${command.action}`,
      ...(command.priviledges != "none" && {
        preMiddleware: [
          deps.authentication({
            verifyFn: verifyFn({ key: command.key || "auth" })
          }),
          deps.authorization({
            permissionsLookupFn,
            priviledges: command.priviledges
          })
        ]
      })
    });
  }

  server.listen();
};
