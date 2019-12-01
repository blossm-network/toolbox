const {
  store,
  write,
  mapReduce,
  findOne
} = require("@blossm/mongodb-database");
const secret = require("@blossm/gcp-secret");
const { string: dateString } = require("@blossm/datetime");
const eventStore = require("@blossm/event-store");
const normalize = require("@blossm/mongodb-event-store-normalize");
const reduce = require("@blossm/mongodb-event-store-reduce");

exports.secret = secret;
exports.dateString = dateString;
exports.eventStore = eventStore;
exports.normalize = normalize;
exports.reduce = reduce;
exports.db = { store, write, mapReduce, findOne };
