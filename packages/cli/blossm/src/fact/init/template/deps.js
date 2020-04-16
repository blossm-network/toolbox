/**
 * Add services that should be faked
 * in this file.
 */

const eventStore = require("@blossm/event-store-rpc");
const gcpToken = require("@blossm/gcp-token");

exports.eventStore = eventStore;
exports.gcpToken = gcpToken;
