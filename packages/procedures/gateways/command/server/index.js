import deps from "./deps.js";

export default async ({
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
  services,
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
    node = false,
    multipart = false,
    local = false,
  } of commands) {
    server = server.post(
      local && services && services[name]
        ? services[name]({ internalTokenFn })
        : deps.post({
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
          ...(multipart ? [deps.uploader.any()] : []),
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
                  node,
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
