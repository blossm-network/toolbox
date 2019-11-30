const { find, findOne } = require("@blossm/mongodb-database");
const { resourceNotFound } = require("@blossm/errors");

exports.db = { find, findOne };
exports.resourceNotFoundError = resourceNotFound;
