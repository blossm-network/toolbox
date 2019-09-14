const asyncHandler = require("express-async-handler");
const kms = require("@sustainers/kms");

const deps = require("./deps");

module.exports = asyncHandler(async req => {
  const claims = await deps.authenticate({
    req,
    verifyFn: kms.verify,
    //temporary
    requiresToken: false
  });

  req.claims = claims;
});
