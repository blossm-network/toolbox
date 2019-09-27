const uuid = require("@sustainers/uuid");
const { fineTimestamp } = require("@sustainers/datetime");
const { remove } = require("@sustainers/mongodb-database");

exports.uuid = uuid;
exports.fineTimestamp = fineTimestamp;
exports.db = { remove };
