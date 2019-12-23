const deps = require("./deps");

module.exports = async ({
  commands,
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
    //eslint-disable-next-line
    console.log("command: ", { command });
    server = server.post(deps.post(), {
      path: `/${command.action}`,
      ...(command.priviledges != "none" && {
        preMiddleware: [
          deps.authentication({ verifyFn }),
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
