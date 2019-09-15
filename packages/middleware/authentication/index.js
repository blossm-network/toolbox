const asyncHandler = require("express-async-handler");
const kms = require("@sustainers/gcp-kms");
const logger = require("@sustainers/logger");

const deps = require("./deps");

module.exports = asyncHandler(async req => {
  logger.info("in auth middleware");
  const claims = await deps.authenticate({
    req,
    verifyFn: kms.verify,
    //temporary
    requiresToken: false
  });

  logger.info("leaving auth middleware");
  req.claims = claims;
});
