const { string: dateString } = require("@sustainers/datetime");
const { write } = require("@sustainers/mongodb-database");

exports.dateString = dateString;
exports.db = { write };
