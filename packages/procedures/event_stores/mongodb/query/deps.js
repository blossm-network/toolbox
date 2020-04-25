const { find } = require("@blossm/mongodb-database");
const aggregate = require("@blossm/mongodb-event-store-aggregate");
const { badRequest } = require("@blossm/errors");

exports.db = { find };
exports.aggregate = aggregate;
exports.badRequestError = badRequest;
