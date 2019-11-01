const asyncHandler = require("express-async-handler");
const deps = require("./deps");

module.exports = ({ scopesLookupFn, priviledgesLookupFn }) =>
  asyncHandler(async (req, _, next) => {
    //eslint-disable-next-line no-console
    console.log("IN AUTHOR MIDDLEWARE");
    const context = await deps.authorize({
      path: req.path,
      claims: req.claims,
      scopesLookupFn,
      priviledgesLookupFn,
      domain: req.params.domain
    });

    //eslint-disable-next-line no-console
    console.log("IN AUTHOR MIDDLEWARE context: ", context);

    req.context = context;
    next();
  });
