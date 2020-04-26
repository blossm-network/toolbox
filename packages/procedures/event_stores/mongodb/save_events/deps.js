const { create } = require("@blossm/mongodb-database");
const { preconditionFailed, badRequest } = require("@blossm/errors");

exports.db = { create };
exports.badRequestError = badRequest;
exports.preconditionFailedError = preconditionFailed;
