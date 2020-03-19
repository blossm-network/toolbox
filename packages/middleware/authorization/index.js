const asyncHandler = require("express-async-handler");
const deps = require("./deps");

module.exports = ({
  permissionsLookupFn,
  terminatedSessionCheckFn,
  permissions
}) =>
  asyncHandler(async (req, _, next) => {
    await Promise.all([
      deps.authorize({
        context: req.context,
        permissionsLookupFn,
        permissions
      }),
      // If there is a session, check if it's terminated.
      ...(req.context && req.context.session
        ? [terminatedSessionCheckFn({ session: req.context.session.root })]
        : [])
    ]);

    next();
  });
