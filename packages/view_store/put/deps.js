const { fineTimestamp } = require("@sustainers/datetime");
const { write } = require("@sustainers/mongodb-database");

exports.fineTimestamp = fineTimestamp;
exports.db = { write };
