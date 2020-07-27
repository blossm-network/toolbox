const { resourceNotFound } = require("@blossm/errors");
const query = require("@blossm/event-store-query");
const aggregate = require("@blossm/event-store-aggregate");

exports.resourceNotFoundError = resourceNotFound;
exports.query = query;
exports.aggregate = aggregate;
