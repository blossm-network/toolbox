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
  //     const channel = `${process.env.NAME}.${
  //       process.env.DOMAIN ? `.${process.env.DOMAIN}` : ""
  //     }${process.env.SERVICE ? `.${process.env.SERVICE}` : ""}.${
  //       process.env.CONTEXT
  //     }.${req.query.context[process.env.CONTEXT].root}.${
  //       req.query.context[process.env.CONTEXT].service
  //     }.${req.query.context[process.env.CONTEXT].network}`;

  //     //respond with the channel that can be subscribed to.
  //     res.status(200).send(channel);
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
  //         const name = req.query.name;
  //         const permissions = views.some((v) => v.name == name).permissions;
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
              cookieKey: key,
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
