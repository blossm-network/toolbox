/**
 * Add services that should be faked
 * in this file.
 */
const { moment, stringFromDate } = require("@blossm/datetime");
exports.viewStore = require("@blossm/view-store-rpc");
exports.gcpToken = require("@blossm/gcp-token");

exports.stringFromDate = stringFromDate;
exports.moment = moment;
