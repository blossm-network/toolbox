const { string: dateString } = require("@blossm/datetime");
const { write } = require("@blossm/mongodb-database");

exports.dateString = dateString;
exports.db = { write };
