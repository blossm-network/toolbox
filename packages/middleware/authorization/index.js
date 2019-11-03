const asyncHandler = require("express-async-handler");
const deps = require("./deps");

module.exports = ({
  domain,
  service,
  network,
  scopesLookupFn,
  priviledgesLookupFn
}) =>
  asyncHandler(async (req, _, next) => {
    //eslint-disable-next-line no-console
    console.log("IN AUTHOR MIDDLEWARE");
    const policy = await deps.authorize({
      path: req.path,
      claims: req.claims,
      scopesLookupFn,
      priviledgesLookupFn,
      domain,
      service,
      network
    });

    //eslint-disable-next-line no-console
    console.log("IN AUTHOR MIDDLEWARE context: ", context);

    req.context = policy.context;
    next();
  });
