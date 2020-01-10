const {
  store,
  write,
  mapReduce,
  findOne
} = require("@blossm/mongodb-database");
const { get: secret } = require("@blossm/gcp-secret");
const { string: dateString } = require("@blossm/datetime");
const eventStore = require("@blossm/event-store");
const normalize = require("@blossm/mongodb-event-store-normalize");
const reduce = require("@blossm/mongodb-event-store-reduce");
const removeIds = require("@blossm/remove-ids-from-mongodb-schema");

exports.secret = secret;
exports.dateString = dateString;
exports.eventStore = eventStore;
exports.normalize = normalize;
exports.reduce = reduce;
exports.db = { store, write, mapReduce, findOne };
exports.removeIds = removeIds;
