const asyncHandler = require("express-async-handler");
const deps = require("./deps");

module.exports = ({
  permissionsLookupFn,
  terminatedSessionCheckFn,
  permissions,
  subcontextKey
}) =>
  asyncHandler(async (req, _, next) => {
    //TODO
    //eslint-disable-next-line no-console
    console.log("AUth middleware", {
      subcontextKey,
      context: req.context,
      subcontext:
        req.context && subcontextKey ? req.context[subcontextKey] : "boop"
    });
    await Promise.all([
      // If there are permissions with a lookup fn, check if the permissions are met.
      ...(permissions && permissionsLookupFn
        ? [
            deps.authorize({
              principle: req.context.principle,
              permissionsLookupFn,
              permissions,
              ...(req.context &&
                subcontextKey && { subcontext: req.context[subcontextKey] })
            })
          ]
        : []),
      // If there is a session, check if it's terminated.
      ...(req.context && req.context.session
        ? [terminatedSessionCheckFn({ session: req.context.session.root })]
        : [])
    ]);

    next();
  });
