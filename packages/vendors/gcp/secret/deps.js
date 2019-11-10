const { decrypt } = require("@blossm/gcp-kms");
const { download } = require("@blossm/gcp-storage");
const { readFile, unlink } = require("fs");
const { promisify } = require("util");

exports.decrypt = decrypt;
exports.download = download;
exports.readFile = promisify(readFile);
exports.unlink = promisify(unlink);
