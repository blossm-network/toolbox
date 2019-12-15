const { decrypt, createKey, encrypt } = require("@blossm/gcp-kms");
const { download, upload } = require("@blossm/gcp-storage");
const { writeFile, readFile, unlink } = require("fs");
const { promisify } = require("util");

exports.decrypt = decrypt;
exports.encrypt = encrypt;
exports.createKey = createKey;
exports.download = download;
exports.upload = upload;
exports.readFile = promisify(readFile);
exports.writeFile = promisify(writeFile);
exports.unlink = promisify(unlink);
