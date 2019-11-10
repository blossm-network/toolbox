const hashString = require("@blossm/hash-string");
const { post, put, get, delete: del } = require("@blossm/request");
const trim = require("@blossm/trim-string");
const { construct } = require("@blossm/errors");

exports.hash = hashString;
exports.post = post;
exports.put = put;
exports.get = get;
exports.delete = del;
exports.trim = trim;
exports.constructError = construct;
