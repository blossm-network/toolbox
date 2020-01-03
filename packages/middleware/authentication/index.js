const asyncHandler = require("express-async-handler");

const deps = require("./deps");

module.exports = ({ verifyFn }) =>
  asyncHandler(async (req, _, next) => {
    //eslint-disable-next-line
    console.log("authenticating: ", verifyFn);
    const claims = await deps.authenticate({
      req,
      verifyFn
    });

    //eslint-disable-next-line
    console.log("claims: ", claims);

    req.claims = claims;
    next();
  });
