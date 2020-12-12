const { forbidden } = require("@blossm/errors");
const { unlinkSync } = require("fs");

exports.forbiddenError = forbidden;
exports.unlinkFile = unlinkSync;
