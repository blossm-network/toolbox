const deps = require("./deps");

module.exports = async ({
  stores,
  domain = process.env.DOMAIN,
  service = process.env.SERVICE,
  whitelist,
  permissionsLookupFn,
  terminatedSessionCheckFn,
  verifyFn,
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
    privileges,
    protection = "strict",
    context
  } of stores) {
    server = server.get(deps.get({ name, domain }), {
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
                    privileges instanceof Array
                      ? privileges.map(priviledge => {
                          return { service, domain, priviledge };
                        })
                      : privileges
                })
              ]
            : [])
        ]
      })
    });
  }

  server.listen();
};
