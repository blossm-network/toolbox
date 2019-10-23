const gateway = require("@sustainers/auth-gateway");

const config = require("./config.json");

module.exports = gateway({
  whitelist: config.whitelist,
  scopesLookupFn: () => []
});
