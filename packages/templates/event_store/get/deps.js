const { find, findOne } = require("@blossm/mongodb-database");
const { notFound } = require("@blossm/errors");

exports.db = { find, findOne };
exports.notFoundError = notFound;
