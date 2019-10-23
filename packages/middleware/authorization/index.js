const asyncHandler = require("express-async-handler");
const deps = require("./deps");

module.exports = ({ scopesLookupFn, priviledgesLookupFn }) =>
  asyncHandler(async (req, _, next) => {
    const context = await deps.authorize({
      path: req.path,
      claims: req.claims,
      scopesLookupFn,
      priviledgesLookupFn,
      domain: req.params.domain
    });

    req.context = context;
    next();
  });
