const server = require("@blossm/server");
const {
  store,
  find,
  findOne,
  write,
  remove
} = require("@blossm/mongodb-database");
const secret = require("@blossm/gcp-secret");
const get = require("@blossm/view-store-get");
const stream = require("@blossm/view-store-stream");
const post = require("@blossm/view-store-post");
const put = require("@blossm/view-store-put");
const del = require("@blossm/view-store-delete");
const { string: stringDate } = require("@blossm/datetime");
const viewStore = require("@blossm/view-store");

exports.secret = secret;
exports.server = server;
exports.get = get;
exports.stream = stream;
exports.post = post;
exports.put = put;
exports.delete = del;
exports.stringDate = stringDate;
exports.viewStore = viewStore;
exports.db = { store, find, findOne, write, remove };
