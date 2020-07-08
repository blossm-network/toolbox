const { write } = require("@blossm/mongodb-database");
const { string: dateString } = require("@blossm/datetime");

exports.db = { write };
exports.dateString = dateString;
