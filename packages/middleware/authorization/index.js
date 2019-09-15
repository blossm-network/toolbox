const asyncHandler = require("express-async-handler");
const deps = require("./deps");
const temp = require("./temp");

module.exports = asyncHandler(async (req, _, next) => {
  const context = await deps.authorize({
    path: req.path,
    claims: req.claims,
    scopesLookupFn: temp,
    domain: req.params.domain
  });

  req.context = context;
  next();
});
