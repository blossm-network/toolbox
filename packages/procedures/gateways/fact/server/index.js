const deps = require("./deps");

module.exports = async ({
  jobs,
  domain = process.env.DOMAIN,
  service = process.env.SERVICE,
  whitelist,
  permissionsLookupFn,
  terminatedSessionCheckFn,
  verifyFn,
  internalTokenFn,
  externalTokenFn,
  algorithm
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

  for (const {
    name,
    key = "access",
    priviledges,
    protection = "strict",
    subcontextKey = process.env.DOMAIN
  } of jobs) {
    server = server.get(
      deps.get({
        name,
        domain,
        internalTokenFn,
        externalTokenFn
      }),
      {
        path: `/${name}`,
        ...(protection != "none" && {
          preMiddleware: [
            deps.authentication({
              verifyFn: verifyFn({ key }),
              audience: process.env.NETWORK,
              algorithm,
              strict: protection == "strict"
            }),
            ...(protection == "strict"
              ? [
                  deps.authorization({
                    permissionsLookupFn,
                    terminatedSessionCheckFn,
                    subcontextKey,
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
