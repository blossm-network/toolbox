const { find } = require("@blossm/mongodb-database");
const aggregate = require("@blossm/mongodb-event-store-aggregate");

exports.db = { find };
exports.aggregate = aggregate;
