const { store } = require("@blossm/mongodb-database");
const { get: secret } = require("@blossm/gcp-secret");
const { string: dateString } = require("@blossm/datetime");
const eventStore = require("@blossm/event-store");
const removeIds = require("@blossm/remove-ids-from-mongodb-schema");
const saveEvents = require("@blossm/mongodb-event-store-save-events");
const aggregate = require("@blossm/mongodb-event-store-aggregate");
const query = require("@blossm/mongodb-event-store-query");

exports.secret = secret;
exports.dateString = dateString;
exports.eventStore = eventStore;
exports.db = { store };
exports.removeIds = removeIds;
exports.saveEvents = saveEvents;
exports.aggregate = aggregate;
exports.query = query;
