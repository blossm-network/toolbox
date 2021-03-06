const server = require("@blossm/server");
const { store } = require("@blossm/mongodb-database");
const get = require("@blossm/event-store-get");
const aggregateStream = require("@blossm/event-store-aggregate-stream");
const rootStream = require("@blossm/event-store-root-stream");
const count = require("@blossm/event-store-count");
const post = require("@blossm/event-store-post");
const createBlock = require("@blossm/event-store-create-block");

exports.store = store;
exports.server = server;
exports.get = get;
exports.post = post;
exports.rootStream = rootStream;
exports.count = count;
exports.aggregateStream = aggregateStream;
exports.createBlock = createBlock;
