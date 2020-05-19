const { resourceNotFound, forbidden } = require("@blossm/errors");
const urlEncodeQueryData = require("@blossm/url-encode-query-data");

exports.resourceNotFoundError = resourceNotFound;
exports.forbiddenError = forbidden;
exports.urlEncodeQueryData = urlEncodeQueryData;
