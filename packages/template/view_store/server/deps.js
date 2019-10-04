const server = require("@sustainers/server");
const { store } = require("@sustainers/mongodb-database");
const secret = require("@sustainers/gcp-secret");
const get = require("@sustainers/view-store-get");
const post = require("@sustainers/view-store-post");
const put = require("@sustainers/view-store-put");
const del = require("@sustainers/view-store-delete");

exports.secret = secret;
exports.store = store;
exports.server = server;
exports.get = get;
exports.post = post;
exports.put = put;
exports.delete = del;
