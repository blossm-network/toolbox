/**
 * Add services that should be faked
 * in this file.
 */

const viewStore = require("@sustainers/view-store-js");
const gcpToken = require("@sustainers/gcp-token");
const { create: createJwt } = require("@sustainers/jwt");
const { sign } = require("@sustainers/gcp-kms");
const { string: stringDate } = require("@sustainers/datetime");

exports.viewStore = viewStore;
exports.gcpToken = gcpToken;
exports.createJwt = createJwt;
exports.sign = sign;
exports.stringDate = stringDate;
