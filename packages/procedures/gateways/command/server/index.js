const deps = require("./deps");

module.exports = async ({
  commands,
  domain = process.env.DOMAIN,
  service = process.env.SERVICE,
  internalTokenFn,
  externalTokenFn,
  whitelist,
  permissionsLookupFn,
  terminatedSessionCheckFn,
  verifyFn,
  keyClaimsFn
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
    network,
    service: commandService,
    key = "access",
    priviledges,
    protection = "strict"
  } of commands) {
    server = server.post(
      deps.post({
        name,
        domain,
        service: commandService || service,
        ...(network && { network }),
        internalTokenFn,
        externalTokenFn
      }),
      {
        path: `/${name}`,
        ...(protection != "none" && {
          preMiddleware: [
            deps.authentication({
              verifyFn: verifyFn({ key }),
              keyClaimsFn,
              strict: protection == "strict"
            }),
            ...(protection == "strict"
              ? [
                  deps.authorization({
                    permissionsLookupFn,
                    terminatedSessionCheckFn,
                    permissions:
                      priviledges instanceof Array
                        ? priviledges.map(priviledge => {
                            return { service, domain, priviledge };
                          })
                        : priviledges
                  })
                ]
              : [])
          ]
        })
      }
    );
  }

  server.listen();
};
