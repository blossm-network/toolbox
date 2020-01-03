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
    //eslint-disable-next-line
    console.log("authorizing: ", {
      domain,
      service,
      network,
      permissionsLookupFn,
      priviledges,
      body: req.body
    });
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

    //eslint-disable-next-line
    console.log("policy: ", policy);
    req.context = policy.context;
    next();
  });
