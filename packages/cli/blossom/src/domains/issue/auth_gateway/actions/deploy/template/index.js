const gateway = require("@sustainers/auth-gateway");
const { verify } = require("@sustainers/gcp-kms");

const config = require("./config.json");

module.exports = gateway({
  whitelist: config.whitelist,
  scopesLookupFn: () => [],
  verifyFn: verify({
    ring: process.env.SERVICE,
    key: "challenge",
    location: "global",
    version: "1",
    project: process.env.GCP_PROJECT
  })
});
