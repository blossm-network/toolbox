const { decrypt } = require("@sustainers/gcp-kms");
const { download } = require("@sustainers/gcp-storage");
const { readFile, unlink } = require("fs");
const { promisify } = require("util");

exports.decrypt = decrypt;
exports.download = download;
exports.readFile = promisify(readFile);
exports.unlink = promisify(unlink);
