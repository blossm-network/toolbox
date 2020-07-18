const { findOne, find } = require("@blossm/mongodb-database");
const { badRequest } = require("@blossm/errors");

exports.db = { findOne, find };
exports.badRequestError = badRequest;
