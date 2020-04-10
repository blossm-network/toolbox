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
  algorithm,
  audience
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
    context
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
              audience,
              algorithm,
              strict: protection == "strict"
            }),
            ...(protection == "strict"
              ? [
                  deps.authorization({
                    permissionsLookupFn,
                    terminatedSessionCheckFn,
                    context,
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
