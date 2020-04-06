const deps = require("./deps");

module.exports = async ({
  jobs,
  domain = process.env.DOMAIN,
  service = process.env.SERVICE,
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

  for (const {
    name,
    key = "access",
    priviledges,
    protection = "strict"
  } of jobs) {
    server = server.get(deps.get({ name, domain }), {
      path: `/${name}`,
      ...(protection != "none" && {
        preMiddleware: [
          deps.authentication({
            verifyFn: verifyFn({ key }),
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
    });
  }

  server.listen();
};
