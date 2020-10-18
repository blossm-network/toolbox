const deps = require("./deps");

module.exports = async ({
  commands,
  domain = process.env.DOMAIN,
  service = process.env.SERVICE,
  internalTokenFn,
  nodeExternalTokenFn,
  algorithm,
  audience,
  allow,
  permissionsLookupFn,
  terminatedSessionCheckFn,
  deletedSceneCheckFn,
  verifyFn,
  keyClaimsFn,
  redirect,
}) => {
  let server = deps.server({
    prehook: (app) =>
      deps.corsMiddleware({
        app,
        allow,
        credentials: true,
        methods: ["POST"],
      }),
  });

  for (const {
    name,
    network,
    service: commandService,
    key = "access",
    privileges,
    protection = "strict",
    basic = false,
    context,
  } of commands) {
    server = server.post(
      deps.post({
        name,
        domain,
        service: commandService || service,
        ...(network && { network }),
        internalTokenFn,
        nodeExternalTokenFn,
        key,
        ...(redirect && { redirect }),
      }),
      {
        path: `/${name}`,
        preMiddleware: [
          deps.authentication({
            verifyFn: verifyFn({ key }),
            cookieKey: key,
            keyClaimsFn,
            audience,
            algorithm,
            protection,
            allowBasic: basic,
          }),
          ...(protection == "strict"
            ? [
                deps.authorization({
                  permissionsLookupFn,
                  terminatedSessionCheckFn,
                  deletedSceneCheckFn,
                  internalTokenFn,
                  context,
                  permissions:
                    privileges instanceof Array
                      ? privileges.map((privilege) => {
                          return { service, domain, privilege };
                        })
                      : privileges,
                }),
              ]
            : []),
        ],
      }
    );
  }

  server.listen();
};
