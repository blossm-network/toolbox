/**
 * Add services that should be faked
 * in this file.
 */

const { badRequest, conflict } = require("@blossm/errors");

exports.badRequestError = badRequest;
exports.conflictError = conflict;
