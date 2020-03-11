const asyncHandler = require("express-async-handler");
const deps = require("./deps");

module.exports = ({
  permissionsLookupFn,
  terminatedSessionCheckFn,
  permissions
}) =>
  asyncHandler(async (req, _, next) => {
    const [policy] = await Promise.all([
      deps.authorize({
        context: req.context,
        claims: req.claims,
        permissionsLookupFn,
        permissions
      }),
      // If there is a session, check if it's terminated.
      ...(req.context && req.context.session
        ? [terminatedSessionCheckFn({ session: req.context.session.root })]
        : [])
    ]);

    req.policy = policy;
    next();
  });
