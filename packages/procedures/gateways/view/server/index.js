const deps = require("./deps");

module.exports = async ({
  views,
  domain = process.env.DOMAIN,
  service = process.env.SERVICE,
  context = process.env.CONTEXT,
  whitelist,
  permissionsLookupFn,
  terminatedSessionCheckFn,
  verifyFn,
  internalTokenFn,
  externalTokenFn,
  algorithm,
  audience,
}) => {
  let server = deps
    .server({
      prehook: (app) =>
        deps.corsMiddleware({
          app,
          whitelist,
          credentials: true,
          methods: ["GET"],
        }),
    })
    .get(deps.channel, {
      path: "/",
      preMiddleware: [
        (req, res, next) => {
          const { permissions, protection = "strict" } = views.find(
            (v) => v.name == req.query.name
          );
          if (protection != "strict") return next();

          //Set the req context since the authenticate middleware isn't called.
          req.context = req.query.context;

          return deps.authorization({
            permissionsLookupFn,
            terminatedSessionCheckFn,
            context,
            permissions:
              permissions instanceof Array
                ? permissions.map((permission) => {
                    const [service, domain, privilege] = permission.split(":");
                    return {
                      service,
                      domain,
                      privilege,
                    };
                  })
                : permissions,
          })(req, res, next);
        },
      ],
    });

  for (const {
    name,
    service: viewService,
    context: viewContext,
    network,
    procedure,
    key = "access",
    permissions,
    protection = "strict",
  } of views) {
    server = server.get(
      deps.get({
        procedure,
        name,
        ...(domain && { domain }),
        ...((viewService || service) && { service: viewService || service }),
        ...((viewContext || context) && { context: viewContext || context }),
        ...(network && { network }),
        internalTokenFn,
        externalTokenFn,
        key,
      }),
      {
        path: `/${name}/:root?`,
        preMiddleware: [
          deps.authentication({
            verifyFn: verifyFn({ key }),
            audience,
            algorithm,
            strict: protection == "strict",
            cookieKey: key,
          }),
          ...(protection == "strict"
            ? [
                deps.authorization({
                  permissionsLookupFn,
                  terminatedSessionCheckFn,
                  //Authenticate based on this procedures context.
                  context,
                  permissions:
                    permissions instanceof Array
                      ? permissions.map((permission) => {
                          const [service, domain, privilege] = permission.split(
                            ":"
                          );
                          return {
                            service,
                            domain,
                            privilege,
                          };
                        })
                      : permissions,
                }),
              ]
            : []),
        ],
      }
    );
  }

  server.listen();
};
