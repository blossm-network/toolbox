const deps = require("./deps");

module.exports = async ({
  commands,
  domain = process.env.DOMAIN,
  service = process.env.SERVICE,
  internalTokenFn,
  externalTokenFn,
  algorithm,
  audience,
  whitelist,
  permissionsLookupFn,
  terminatedSessionCheckFn,
  verifyFn,
  keyClaimsFn,
}) => {
  let server = deps.server({
    prehook: (app) =>
      deps.corsMiddleware({
        app,
        whitelist,
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
    subcontext,
  } of commands) {
    server = server.post(
      deps.post({
        name,
        domain,
        service: commandService || service,
        ...(network && { network }),
        internalTokenFn,
        externalTokenFn,
        key,
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
            strict: protection == "strict",
            allowBasic: basic,
          }),
          ...(protection == "strict"
            ? [
                deps.authorization({
                  permissionsLookupFn,
                  terminatedSessionCheckFn,
                  context: subcontext,
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
