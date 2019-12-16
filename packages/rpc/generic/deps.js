const { post, put, get, delete: del } = require("@blossm/request");
const { construct } = require("@blossm/errors");
const serviceToken = require("@blossm/service-token");
const serviceUrl = require("@blossm/service-url");

exports.post = post;
exports.put = put;
exports.get = get;
exports.delete = del;
exports.constructError = construct;
exports.serviceUrl = serviceUrl;
exports.serviceToken = serviceToken;
