const { post, put, get, delete: del } = require("@blossm/request");
const { construct } = require("@blossm/errors");
const operationToken = require("@blossm/operation-token");
const operationUrl = require("@blossm/operation-url");

exports.post = post;
exports.put = put;
exports.get = get;
exports.delete = del;
exports.constructError = construct;
exports.operationUrl = operationUrl;
exports.operationToken = operationToken;
