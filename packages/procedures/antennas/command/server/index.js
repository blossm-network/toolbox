const deps = require("./deps");

module.exports = async ({
  whitelist,
  tokenFn,
  verifyFn,
  keyClaimsFn,
  terminatedSessionCheckFn,
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
    .post(deps.post({ tokenFn }), {
      preMiddleware: [
        deps.authentication({
          verifyFn: verifyFn({ key }),
          keyClaimsFn
        }),
        deps.authorization({
          terminatedSessionCheckFn
        })
      ]
    });

  server.listen();
};
