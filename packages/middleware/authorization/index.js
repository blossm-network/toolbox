const asyncHandler = require("express-async-handler");
const deps = require("./deps");

module.exports = ({
  domain,
  service = process.env.SERVICE,
  network = process.env.NETWORK,
  permissionsLookupFn,
  terminatedSessionCheckFn,
  priviledges
}) =>
  asyncHandler(async (req, _, next) => {
    const [policy] = await Promise.all([
      deps.authorize({
        path: req.path,
        context: req.context,
        session: req.session,
        permissionsLookupFn,
        priviledges,
        domain,
        service,
        network,
        ...(req.body.root && { root: req.body.root })
      }),
      // If there is a session, check if it's terminated.
      ...(req.context && req.context.session
        ? [terminatedSessionCheckFn({ session: req.context.session })]
        : [])
    ]);

    req.policy = policy;
    next();
  });
