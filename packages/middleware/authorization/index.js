const asyncHandler = require("express-async-handler");
const deps = require("./deps");

module.exports = ({
  permissionsLookupFn,
  terminatedSessionCheckFn,
  permissions,
  context,
}) =>
  asyncHandler(async (req, _, next) => {
    await Promise.all([
      // If there are permissions with a lookup fn, check if the permissions are met.
      ...(permissions && permissionsLookupFn
        ? [
            deps.authorize({
              principle: req.context.principle,
              permissionsLookupFn,
              permissions,
              ...(req.context && context && { context: req.context[context] }),
            }),
          ]
        : []),
      // If there is a session, check if it's terminated.
      ...(req.context && req.context.session
        ? [terminatedSessionCheckFn({ session: req.context.session })]
        : []),
    ]);

    next();
  });
