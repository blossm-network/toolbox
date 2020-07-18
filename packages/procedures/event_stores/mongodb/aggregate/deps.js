const { findOne, stream } = require("@blossm/mongodb-database");
const { badRequest } = require("@blossm/errors");

exports.db = { findOne, stream };
exports.badRequestError = badRequest;
