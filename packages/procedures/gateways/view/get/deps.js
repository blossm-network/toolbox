const viewStore = require("@blossm/view-store-rpc");
const viewComposite = require("@blossm/view-composite-rpc");
const { forbidden } = require("@blossm/errors");

exports.viewStore = viewStore;
exports.viewComposite = viewComposite;
exports.forbiddenError = forbidden;
