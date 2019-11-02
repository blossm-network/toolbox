const asyncHandler = require("express-async-handler");

const deps = require("./deps");

module.exports = ({ verifyFn }) =>
  asyncHandler(async (req, _, next) => {
    const claims = await deps.authenticate({
      req,
      verifyFn
    });

    req.claims = claims;
    next();
  });
