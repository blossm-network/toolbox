const deps = require("./deps");

module.exports = async ({
  stores,
  domain = process.env.DOMAIN,
  service = process.env.SERVICE,
  context = process.env.CONTEXT,
  whitelist,
  permissionsLookupFn,
  terminatedSessionCheckFn,
  verifyFn,
  algorithm,
  audience,
}) => {
  let server = deps.server({
    prehook: (app) =>
      deps.corsMiddleware({
        app,
        whitelist,
        credentials: true,
        methods: ["GET"],
      }),
  });
  // .get(
  //   (req, res) => {
  //     res.sendStatus(200);
  //   },
  //   {
  //     preMiddleware: [
  //       deps.authentication({
  //         verifyFn: verifyFn({ key: "access" }),
  //         audience,
  //         algorithm,
  //         strict: true,
  //       }),
  //       async (req, _, next) => {
  //         const store = req.query.store;
  //         const permissions = stores.some((s) => s.name == store).permissions;
  //         await deps.authorization({
  //           permissionsLookupFn,
  //           terminatedSessionCheckFn,
  //           context,
  //           permissions:
  //             permissions instanceof Array
  //               ? permissions.map((permission) => {
  //                   const [service, domain, privilege] = permission.split(
  //                     ":"
  //                   );
  //                   return {
  //                     service,
  //                     domain,
  //                     privilege,
  //                   };
  //                 })
  //               : permissions,
  //         });
  //         next();
  //       },
  //     ],
  //   }
  // );

  for (const {
    name,
    key = "access",
    permissions,
    protection = "strict",
  } of stores) {
    server = server.get(
      deps.get({
        name,
        ...(domain && { domain }),
        ...(service && { service }),
      }),
      {
        path: `/${name}`,
        ...(protection != "none" && {
          preMiddleware: [
            deps.authentication({
              verifyFn: verifyFn({ key }),
              audience,
              algorithm,
              strict: protection == "strict",
            }),
            ...(protection == "strict"
              ? [
                  deps.authorization({
                    permissionsLookupFn,
                    terminatedSessionCheckFn,
                    context,
                    permissions:
                      permissions instanceof Array
                        ? permissions.map((permission) => {
                            const [
                              service,
                              domain,
                              privilege,
                            ] = permission.split(":");
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
        }),
      }
    );
  }

  server.listen();
};
