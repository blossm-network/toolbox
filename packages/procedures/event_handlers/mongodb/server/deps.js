const { store } = require("@blossm/mongodb-database");
const { get: secret } = require("@blossm/gcp-secret");
const eventHandler = require("@blossm/event-handler");

exports.secret = secret;
exports.eventHandler = eventHandler;
exports.db = { store };
