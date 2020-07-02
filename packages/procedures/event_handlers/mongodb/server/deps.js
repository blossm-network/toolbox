const { store, find, write } = require("@blossm/mongodb-database");
const eventHandler = require("@blossm/event-handler");

exports.eventHandler = eventHandler;
exports.db = { store, find, write };
