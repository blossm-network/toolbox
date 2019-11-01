const asyncHandler = require("express-async-handler");

const deps = require("./deps");

module.exports = verifyFn =>
  asyncHandler(async (req, _, next) => {
    //eslint-disable-next-line no-console
    console.log("IN AUTHEN MIDDLEWARE");
    const claims = await deps.authenticate({
      req,
      verifyFn
    });

    //eslint-disable-next-line no-console
    console.log("IN AUTHEN MIDDLEWARE claims: ", claims);

    req.claims = claims;
    next();
  });
