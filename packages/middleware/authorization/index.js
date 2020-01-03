const asyncHandler = require("express-async-handler");
const deps = require("./deps");

module.exports = ({
  domain,
  service = process.env.SERVICE,
  network = process.env.NETWORK,
  permissionsLookupFn,
  priviledges
}) =>
  asyncHandler(async (req, _, next) => {
    const policy = await deps.authorize({
      path: req.path,
      claims: req.claims,
      permissionsLookupFn,
      priviledges,
      domain,
      service,
      network,
      ...(req.body.root && { root: req.body.root })
    });

    req.context = policy.context;
    next();
  });
