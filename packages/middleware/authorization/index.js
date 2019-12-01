const asyncHandler = require("express-async-handler");
const deps = require("./deps");

module.exports = ({
  domain,
  service = process.env.SERVICE,
  network = process.env.NETWORK,
  scopesLookupFn,
  priviledgesLookupFn
}) =>
  asyncHandler(async (req, _, next) => {
    const policy = await deps.authorize({
      path: req.path,
      claims: req.claims,
      scopesLookupFn,
      priviledgesLookupFn,
      domain,
      service,
      network
    });

    req.context = policy.context;
    next();
  });
