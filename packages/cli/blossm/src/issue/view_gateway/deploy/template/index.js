const gateway = require("@blossm/a-gateway");

const scopes = require("./scopes.js");

const config = require("./config.json");

module.exports = gateway({
  whitelist: config.whitelist,
  scopesLookupFn: scopes
});
