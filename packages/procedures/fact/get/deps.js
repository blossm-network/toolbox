const { forbidden } = require("@blossm/errors");
const { unlink } = require("fs");

exports.forbiddenError = forbidden;
exports.unlinkFile = unlink;
