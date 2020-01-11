const {
  store,
  find,
  findOne,
  write,
  remove
} = require("@blossm/mongodb-database");
const { get: secret } = require("@blossm/gcp-secret");
const { string: stringDate } = require("@blossm/datetime");
const viewStore = require("@blossm/view-store");
const removeIds = require("@blossm/remove-ids-from-mongodb-schema");

exports.secret = secret;
exports.stringDate = stringDate;
exports.viewStore = viewStore;
exports.db = { store, find, findOne, write, remove };
exports.removeIds = removeIds;
