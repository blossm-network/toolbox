import deps from "./deps.js";

export default async ({
  views,
  context = process.env.CONTEXT,
  allow,
  permissionsLookupFn,
  terminatedSessionCheckFn,
  deletedSceneCheckFn,
  verifyFn,
  internalTokenFn,
  nodeExternalTokenFn,
  algorithm,
  audience,
  redirect,
}) => {
  let server = deps
    .server({
      prehook: (app) =>
        deps.corsMiddleware({
          app,
          allow,
          credentials: true,
          methods: ["GET"],
        }),
    })
    .get(deps.channel, {
      path: "/",
      preMiddleware: [
        (req, res, next) => {
          const view = views.find((v) => v.name == req.query.name);

          //Channels are only available to protected views.
          if (!view || (view.protection && view.protection != "strict"))
            return next();

          //Set the req context since the authenticate middleware isn't called.
          req.context = req.query.context;

          return deps.authorization({
            permissionsLookupFn,
            terminatedSessionCheckFn,
            deletedSceneCheckFn,
            internalTokenFn,
            context,
            permissions:
              view.permissions instanceof Array
                ? view.permissions.map((permission) => {
                    const [service, domain, privilege] = permission.split(":");
                    return {
                      service,
                      domain,
                      privilege,
                    };
                  })
                : view.permissions,
          })(req, res, next);
        },
      ],
    });

  for (const {
    name,
    network,
    procedure,
    key = "access",
    permissions = "none",
    protection = "strict",
  } of views) {
    server = server.get(
      deps.get({
        procedure,
        redirect,
        name,
        ...(network && { network }),
        internalTokenFn,
        nodeExternalTokenFn,
        key,
      }),
      {
        path: `/${name}/:id?`,
        preMiddleware: [
          deps.authentication({
            verifyFn: verifyFn({ key }),
            audience,
            algorithm,
            protection,
            cookieKey: key,
          }),
          ...(protection == "strict"
            ? [
                deps.authorization({
                  permissionsLookupFn,
                  terminatedSessionCheckFn,
                  deletedSceneCheckFn,
                  internalTokenFn,
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
