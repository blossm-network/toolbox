const deps = require("./deps");

module.exports = async ({
  whitelist,
  verifyFn,
  keyClaimsFn,
  key = "access"
}) => {
  let server = deps
    .server({
      prehook: app =>
        deps.corsMiddleware({
          app,
          whitelist,
          credentials: true,
          methods: ["POST"]
        })
    })
    .post(deps.post(), {
      preMiddleware: [
        deps.authentication({
          verifyFn: verifyFn({ key }),
          keyClaimsFn
        })
      ]
    });

  server.listen();
};
